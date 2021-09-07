import * as path from "path"
import * as os from "os"

import { ProcessType, UI } from "./enum.js"
import { Script } from "./type.js"
import { copyFileSync, lstatSync } from "fs"
import { readFile, readdir, lstat } from "fs/promises"
import { execSync } from "child_process"

export let home = (...pathParts: string[]) => {
  return path.resolve(os.homedir(), ...pathParts)
}

export let wait = async (time: number): Promise<void> =>
  new Promise(res => setTimeout(res, time))

export let checkProcess = (pid: string | number) => {
  return execSync(`kill -0 ` + pid).buffer.toString()
}

export let isFile = async (
  file: string
): Promise<boolean> => {
  try {
    let stats = await lstat(file)
    return stats.isFile()
  } catch {
    return false
  }
}

export let isDir = async (
  dir: string
): Promise<boolean> => {
  try {
    let stats = await lstat(dir)

    return stats.isDirectory()
  } catch {
    return false
  }
}

export let isBin = async (
  bin: string
): Promise<boolean> => {
  try {
    return Boolean(execSync(`command -v ${bin}`))
  } catch {
    return false
  }
}

export let kitPath = (...parts: string[]) =>
  path.join(
    process.env.KIT || home(".kit"),
    ...parts.filter(Boolean)
  )

export let kenvPath = (...parts: string[]) => {
  return path.join(
    process.env.KENV || home(".kenv"),
    ...parts.filter(Boolean)
  )
}

export let kitDotEnv = () => {
  return process.env.KIT_DOTENV || kenvPath(".env")
}

export const prefsPath = kitPath("db", "prefs.json")
export const shortcutsPath = kitPath("db", "shortcuts.json")
export const promptDbPath = kitPath("db", "prompt.json")
export const appDbPath = kitPath("db", "app.json")
export const tmpClipboardDir = kitPath("tmp", "clipboard")
export const tmpDownloadsDir = kitPath("tmp", "downloads")
export const mainScriptPath = kitPath("main", "index.js")
export const execPath = kitPath("node", "bin", "node")

export const KENV_SCRIPTS = kenvPath("scripts")
export const KENV_APP = kenvPath("app")
export const KENV_BIN = kenvPath("bin")

export const KIT_MAC_APP = kitPath("mac-app.js")
export const KIT_MAC_APP_PROMPT = kitPath(
  "mac-app-prompt.js"
)
export const PATH = `${kitPath(
  "node",
  "bin"
)}:/usr/local/bin:/usr/bin:${process.env.PATH}`

export let assignPropsTo = (
  source: { [s: string]: unknown } | ArrayLike<unknown>,
  target: { [x: string]: unknown }
) => {
  Object.entries(source).forEach(([key, value]) => {
    target[key] = value
  })
}

let fileExists = (path: string) => {
  try {
    return lstatSync(path, {
      throwIfNoEntry: false,
    })?.isFile()
  } catch {
    return false
  }
}

export let resolveToScriptPath = (
  file: string,
  cwd: string = process.cwd()
) => {
  let script = file
  if (!script.endsWith(".js")) script += ".js"

  // Check full path
  if (script.startsWith(path.sep)) {
    if (!fileExists(script)) {
      throw new Error(`${script} not found`)
    }
    return script
  }

  // Check anywhere
  let notKenvPath = path.resolve(cwd, script)

  if (fileExists(notKenvPath)) {
    let baseName = path.basename(notKenvPath)
    let tmpKitScriptPath = kitPath("tmp", baseName)
    copyFileSync(notKenvPath, tmpKitScriptPath)
    return tmpKitScriptPath
  }

  // Check main kenv
  let kenvScript = kenvPath("scripts", script)
  if (fileExists(kenvScript)) return kenvScript

  // Check other kenvs
  let [k, s] = script.split("/")
  if (s) {
    kenvScript = kenvPath("kenvs", k, "scripts", s)
    if (fileExists(kenvScript)) return kenvScript
  }

  throw new Error(`${file} not found`)
}

export let resolveScriptToCommand = (script: string) => {
  return script.replace(/.*\//, "").replace(".js", "")
}

export const shortcutNormalizer = (shortcut: string) =>
  shortcut
    ? shortcut
        .replace(/(option|opt)/i, "Alt")
        .replace(/(command|cmd)/i, "CommandOrControl")
        .replace(/(ctl|cntrl|ctrl)/, "Control")
        .split(/\s/)
        .filter(Boolean)
        .map(part =>
          (part[0].toUpperCase() + part.slice(1)).trim()
        )
        .join("+")
    : ""

export const friendlyShortcut = (shortcut: string) => {
  let f = ""
  if (shortcut.includes("CommandOrControl+")) f += "cmd+"
  if (shortcut.includes("Control+")) f += "ctrl+"
  if (shortcut.includes("Alt+")) f += "opt+"
  if (shortcut.includes("Shift+")) f += "shift+"
  if (shortcut.includes("+"))
    f += shortcut.split("+").pop()?.toLowerCase()

  return f
}

export let info = async (
  filePath: string
): Promise<Script> => {
  let fileContents = await readFile(filePath, "utf8")

  let getByMarker = (marker: string) =>
    fileContents
      .match(
        new RegExp(`(?<=^//\\s*${marker}\\s*).*`, "gim")
      )?.[0]
      .trim() || ""

  let command =
    filePath.split(path.sep)?.pop()?.replace(".js", "") ||
    ""

  let shortcut = shortcutNormalizer(
    getByMarker("Shortcut:")
  )
  let menu = getByMarker("Menu:")
  let schedule = getByMarker("Schedule:")
  let watch = getByMarker("Watch:")
  let system = getByMarker("System:")
  let img = getByMarker("Image:")
  let background = getByMarker("Background:")
  let timeout = parseInt(getByMarker("Timeout:"), 10)

  let tabs =
    fileContents.match(
      new RegExp(`(?<=^onTab[(]['"]).*(?=\s*['"])`, "gim")
    ) || []

  let hasFlags = Boolean(
    fileContents.match(
      new RegExp(`(?<=^setFlags).*`, "gim")
    )
  )

  let ui = (getByMarker("UI:") ||
    fileContents
      .match(/(?<=await )arg|textarea|hotkey|drop/g)?.[0]
      .trim() ||
    UI.none) as UI

  let requiresPrompt = ui !== UI.none

  let type = schedule
    ? ProcessType.Schedule
    : watch
    ? ProcessType.Watch
    : system
    ? ProcessType.System
    : background
    ? ProcessType.Background
    : ProcessType.Prompt

  let kenv =
    filePath.match(
      new RegExp(`(?<=${kenvPath("kenvs")}\/)[^\/]+`)
    )?.[0] || ""

  let iconPath = kenv
    ? kenvPath("kenvs", kenv, "icon.png")
    : ""

  let icon =
    kenv && (await isFile(iconPath)) ? iconPath : ""

  return {
    command,
    type,
    shortcut,
    friendlyShortcut: friendlyShortcut(shortcut),
    menu,
    name: menu || command,
    description: getByMarker("Description:"),
    alias: getByMarker("Alias:"),
    author: getByMarker("Author:"),
    twitter: getByMarker("Twitter:"),
    shortcode: getByMarker("Shortcode:")
      ?.split(" ")
      .map(sc => sc.trim().toLowerCase()),
    exclude: Boolean(getByMarker("Exclude:") === "true"),
    log: Boolean(getByMarker("Log:") !== "false"),
    hasFlags,
    schedule,
    watch,
    system,
    background,
    id: filePath,
    filePath,
    requiresPrompt,
    timeout,
    tabs,
    kenv,
    img,
    icon,
  }
}

export let getLastSlashSeparated = (
  string: string,
  count: number
) => {
  return (
    string
      .replace(/\/$/, "")
      .split("/")
      .slice(-count)
      .join("/") || ""
  )
}

export let getScriptFiles = async (kenv = kenvPath()) => {
  let scriptsPath = path.join(kenv, "scripts")
  if (!(await isDir(scriptsPath))) {
    console.warn(`${scriptsPath} isn't a valid kenv dir`)
    return []
  }

  let result = await readdir(scriptsPath, {
    withFileTypes: true,
  })

  return result
    .filter(file => file.isFile())
    .map(file => file.name)
    .filter(name => name.endsWith(".js"))
    .map(file => path.join(scriptsPath, file))
}

export let getKenvs = async (): Promise<string[]> => {
  let kenvs: string[] = []
  if (!(await isDir(kenvPath("kenvs")))) return kenvs

  let dirs = await readdir(kenvPath("kenvs"), {
    withFileTypes: true,
  })

  return dirs
    .filter(d => d.isDirectory())
    .map(d => kenvPath("kenvs", d.name))
}

export let writeScriptsDb = async () => {
  let scriptFiles = await getScriptFiles()
  let kenvDirs = await getKenvs()
  for await (let kenvDir of kenvDirs) {
    let scripts = await getScriptFiles(kenvDir)
    scriptFiles = [...scriptFiles, ...scripts]
  }

  let scriptInfo = await Promise.all(scriptFiles.map(info))
  return scriptInfo.sort((a: Script, b: Script) => {
    let aName = a.name.toLowerCase()
    let bName = b.name.toLowerCase()

    return aName > bName ? 1 : aName < bName ? -1 : 0
  })
}

export let stripMetadata = (fileContents: string) => {
  let markers = [
    "Menu",
    "Schedule",
    "Watch",
    "System",
    "Background",
    "Shortcode",
    "Exclude",
    "Alias",
    "Shortcut",
  ]
  return fileContents.replace(
    new RegExp(`(^//\\s*(${markers.join("|")}):).*`, "gim"),
    "$1"
  )
}

export const getLogFromScriptPath = (filePath: string) => {
  return filePath
    .replace("scripts", "logs")
    .replace(/\.js$/, ".log")
}

declare global {
  namespace NodeJS {
    interface Global {
      kitScript: string
    }
  }
}

export const resolveKenv = (...parts: string[]) => {
  if (global.kitScript) {
    return path.resolve(
      global.kitScript,
      "..",
      "..",
      ...parts
    )
  }

  return kenvPath(...parts)
}
