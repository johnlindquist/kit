import * as path from "path"
import * as os from "os"
import { lstatSync } from "fs"
import { readFile, readdir, lstat } from "fs/promises"
import { execSync } from "child_process"

import { ProcessType, UI } from "./enum.js"
import { Script } from "./type.js"
import { Bin, Channel } from "./enum.js"
import { getScripts, getScriptFromString } from "./db.js"

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

export const KIT_APP = kitPath("run", "app.js")
export const KIT_APP_PROMPT = kitPath(
  "run",
  "app-prompt.js"
)
export const KIT_NODE_PATH =
  process.env.KIT_NODE_PATH || `${kitPath("node", "bin")}`

export const KIT_DEFAULT_PATH = `${process.env.PATH}:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`

export const KIT_FIRST_PATH = `${kitPath("bin")}:${kenvPath(
  "bin"
)}:${KIT_NODE_PATH}:${KIT_DEFAULT_PATH}`

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
): string => {
  let script = file
  if (!script.match(/(.js|.mjs|.ts)$/)) script += ".js"

  // Check main kenv
  let kenvScript = kenvPath("scripts", script)
  if (fileExists(kenvScript)) return kenvScript

  // Check other kenvs
  let [k, s] = script.split("/")
  if (s) {
    kenvScript = kenvPath("kenvs", k, "scripts", s)
    if (fileExists(kenvScript)) return kenvScript
  }

  // Check scripts dir

  let maybeInScriptDir = path.resolve(
    cwd,
    "scripts",
    script
  )
  if (test("-f", maybeInScriptDir)) {
    return maybeInScriptDir
  }
  // Check anywhere
  let fullScriptPath = path.resolve(cwd, script)

  if (fileExists(fullScriptPath)) {
    return fullScriptPath
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

export let selectScript = async (
  message: string | PromptConfig = "Select a script",
  fromCache = true,
  xf = x => x
): Promise<Script> => {
  let script = await arg<Script | string>(
    message,
    xf(await getScripts(fromCache))
  )

  if (typeof script === "string") {
    return await getScriptFromString(script)
  }

  return script
}

//validator
export let exists = async (input: string) => {
  return (await isBin(kenvPath("bin", input)))
    ? chalk`{red.bold ${input}} already exists. Try again:`
    : (await isDir(kenvPath("bin", input)))
    ? chalk`{red.bold ${input}} exists as group. Enter different name:`
    : exec(`command -v ${input}`, {
        silent: true,
      }).stdout
    ? chalk`{red.bold ${input}} is a system command. Enter different name:`
    : !input.match(/^([a-z]|[0-9]|\-|\/)+$/g)
    ? chalk`{red.bold ${input}} can only include lowercase, numbers, and -. Enter different name:`
    : true
}

export let toggleBackground = async (script: Script) => {
  let { tasks } = await global.getBackgroundTasks()

  let task = tasks.find(
    task => task.filePath === script.filePath
  )

  let toggleOrLog = await arg<"toggle" | "log" | "edit">(
    `${script.command} is ${task ? `running` : `stopped`}`,
    [
      {
        name: `${task ? `Stop` : `Start`} ${
          script.command
        }`,
        value: `toggle`,
      },
      { name: `Edit ${script.command}`, value: `edit` },
      { name: `View ${script.command}.log`, value: `log` },
    ]
  )

  if (toggleOrLog === "toggle") {
    send(Channel.TOGGLE_BACKGROUND, {
      filePath: script.filePath,
    })
  }

  if (toggleOrLog === "edit") {
    await edit(script.filePath, kenvPath())
  }

  if (toggleOrLog === "log") {
    await edit(
      kenvPath("logs", `${script.command}.log`),
      kenvPath()
    )
  }
}

export let createBinFromScript = async (
  type: Bin,
  { kenv, command }: Script
) => {
  let binTemplate = await readFile(
    kitPath("templates", "bin", "template"),
    "utf8"
  )

  let targetPath = (...parts) =>
    kenvPath(kenv && `kenvs/${kenv}`, ...parts)

  let binTemplateCompiler = compile(binTemplate)
  let compiledBinTemplate = binTemplateCompiler({
    command,
    type,
    ...env,
    TARGET_PATH: targetPath(),
  })

  let binFilePath = targetPath("bin", command)

  mkdir("-p", path.dirname(binFilePath))
  await writeFile(binFilePath, compiledBinTemplate)
  chmod(755, binFilePath)
}

export let createBinFromName = async (
  command: string,
  kenv: string
) => {
  let binTemplate = await readFile(
    kitPath("templates", "bin", "template"),
    "utf8"
  )

  let binTemplateCompiler = compile(binTemplate)
  let compiledBinTemplate = binTemplateCompiler({
    command,
    type: Bin.scripts,
    ...env,
    TARGET_PATH: kenv,
  })

  let binFilePath = path.resolve(kenv, "bin", command)

  mkdir("-p", path.dirname(binFilePath))
  await writeFile(binFilePath, compiledBinTemplate)
  chmod(755, binFilePath)
}

export let trashBinFromScript = async (script: Script) => {
  trash([
    kenvPath(
      script.kenv && `kenvs/${script.kenv}`,
      "bin",
      script.command
    ),
  ])
}

type Kenv = {
  name: string
  dirPath: string
}
export let selectKenv = async (): Promise<Kenv> => {
  let homeKenv = {
    name: "home",
    description: `Your main kenv: ${kenvPath()}`,
    value: {
      name: "home",
      dirPath: kenvPath(),
    },
  }
  let selectedKenv: Kenv | string = homeKenv.value

  let kenvs = await getKenvs()
  if (kenvs.length) {
    let kenvChoices = [
      homeKenv,
      ...kenvs.map(p => {
        let name = getLastSlashSeparated(p, 1)
        return {
          name,
          description: p,
          value: {
            name,
            dirPath: p,
          },
        }
      }),
    ]

    selectedKenv = await arg<Kenv | string>(
      `Select target kenv`,
      kenvChoices
    )

    if (typeof selectedKenv === "string") {
      return kenvChoices.find(
        c =>
          c.value.name === selectedKenv ||
          path.resolve(c.value.dirPath) ===
            path.resolve(selectedKenv as string)
      ).value
    }
  }

  return selectedKenv as Kenv
}
