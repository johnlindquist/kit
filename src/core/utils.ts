import { config } from "@johnlindquist/kit-internal/dotenv-flow"
import * as path from "path"
import {
  Script,
  ScriptPathInfo,
  ScriptMetadata,
  Metadata,
  Shortcut,
} from "../types/core"
import { platform, homedir } from "os"
import { lstatSync, PathLike } from "fs"
import { lstat, readdir, readFile } from "fs/promises"

import { execSync } from "child_process"

import { ProcessType, Channel } from "./enum.js"

export let isWin = platform().startsWith("win")
export let isMac = platform().startsWith("darwin")
export let isLinux = platform().startsWith("linux")
export let cmd = isMac ? "cmd" : "ctrl"
export let returnOrEnter = isMac ? "return" : "enter"

export let extensionRegex = /\.(mjs|ts|js)$/g
export let jsh = process.env?.SHELL?.includes("jsh")

export let home = (...pathParts: string[]) => {
  return path.resolve(homedir(), ...pathParts)
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

//app
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
  if (jsh) return false
  try {
    return Boolean(execSync(`command -v ${bin}`))
  } catch {
    return false
  }
}

export let createPathResolver =
  (parentDir: string) =>
  (...parts: string[]) => {
    return path.resolve(parentDir, ...parts)
  }

//app
export let kitPath = (...parts: string[]) =>
  path.join(
    process.env.KIT || home(".kit"),
    ...parts.filter(Boolean)
  )

// //app
export let kenvPath = (...parts: string[]) => {
  return path.join(
    process.env.KENV || home(".kenv"),
    ...parts.filter(Boolean)
  )
}

export let kitDotEnvPath = () => {
  return process.env.KIT_DOTENV_PATH || kenvPath()
}

export let knodePath = (...parts: string[]) =>
  path.join(
    process.env.KNODE || home(".knode"),
    ...parts.filter(Boolean)
  )

export const scriptsDbPath = kitPath("db", "scripts.json")
export const timestampsPath = kitPath(
  "db",
  "timestamps.json"
)
export const prefsPath = kitPath("db", "prefs.json")
export const shortcutsPath = kitPath("db", "shortcuts.json")
export const promptDbPath = kitPath("db", "prompt.json")
export const appDbPath = kitPath("db", "app.json")
export const tmpClipboardDir = kitPath("tmp", "clipboard")
export const tmpDownloadsDir = kitPath("tmp", "downloads")
export const mainScriptPath = kitPath("main", "index.js")
export const execPath = knodePath(
  "bin",
  `node${isWin ? `.exe` : ``}`
)
export const kitDocsPath = home(".kit-docs")

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

let combinePath = (arrayOfPaths: string[]): string => {
  let [combinedPath, ...rest] = arrayOfPaths
  combinedPath = path.resolve(combinedPath)
  for (let p of rest) {
    combinedPath += path.delimiter + path.resolve(p)
  }

  return combinedPath
}
export const KIT_DEFAULT_PATH = isWin
  ? ``
  : combinePath([
      "/usr/local/bin",
      "/usr/bin",
      "/bin",
      "/usr/sbin",
      "/sbin",
    ])

export const KIT_FIRST_PATH =
  combinePath([
    knodePath("bin"),
    kitPath("bin"),
    ...(isWin ? [] : [kitPath("bin", "code")]),
    kenvPath("bin"),
  ]) +
  path.delimiter +
  KIT_DEFAULT_PATH

export const KIT_LAST_PATH =
  process.env.PATH +
  path.delimiter +
  KIT_DEFAULT_PATH +
  path.delimiter +
  combinePath([
    knodePath("bin"),
    kitPath("bin"),
    ...(isWin ? [] : [kitPath("bin", "code")]),
    kenvPath("bin"),
  ])

export let assignPropsTo = (
  source: { [s: string]: unknown } | ArrayLike<unknown>,
  target: { [x: string]: unknown }
) => {
  Object.entries(source).forEach(([key, value]) => {
    target[key] = value
  })
}

//app
let fileExists = (path: string) => {
  try {
    return lstatSync(path, {
      throwIfNoEntry: false,
    })?.isFile()
  } catch {
    return false
  }
}

//app
export let resolveToScriptPath = (
  script: string,
  cwd: string = process.cwd()
): string => {
  let extensions = ["", ".js", ".ts"]
  let resolvedScriptPath = ""

  // if (!script.match(/(.js|.mjs|.ts)$/)) script += ".js"

  // Check main kenv

  for (let ext of extensions) {
    resolvedScriptPath = kenvPath("scripts", script + ext)
    if (fileExists(resolvedScriptPath))
      return resolvedScriptPath
  }

  // Check other kenvs
  let [k, s] = script.split("/")
  if (s) {
    for (let ext of extensions) {
      resolvedScriptPath = kenvPath(
        "kenvs",
        k,
        "scripts",
        s + ext
      )
      if (fileExists(resolvedScriptPath))
        return resolvedScriptPath
    }
  }

  // Check scripts dir

  for (let ext of extensions) {
    resolvedScriptPath = path.resolve(
      cwd,
      "scripts",
      script + ext
    )
    if (fileExists(resolvedScriptPath))
      return resolvedScriptPath
  }

  // Check anywhere

  for (let ext of extensions) {
    resolvedScriptPath = path.resolve(cwd, script + ext)
    if (fileExists(resolvedScriptPath))
      return resolvedScriptPath
  }

  throw new Error(`${script} not found`)
}

export let resolveScriptToCommand = (script: string) => {
  return path
    .basename(script)
    .replace(new RegExp(`\\${path.extname(script)}$`), "")
}

//app
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
  if (shortcut.match(/(?<!Or)Control\+/)) f += "ctrl+"
  if (shortcut.includes("Alt+")) f += "opt+"
  if (shortcut.includes("Shift+")) f += "shift+"
  if (shortcut.includes("+"))
    f += shortcut.split("+").pop()?.toLowerCase()

  return f
}

//app
export let getMetadata = (string: string): Metadata => {
  let matches = string.matchAll(
    /(?<=^\/\/\s{0,2})([\w-]+)(?::)(.*)/gm
  )
  let metadata = {}
  for (let [, key, value] of matches) {
    let v = value.trim()
    if (v.length) {
      let k = key.trim()
      k = k[0].toLowerCase() + k.slice(1)
      if (!metadata[k]) metadata[k] = v
    }
  }

  return metadata
}

//app
export let formatScriptMetadata = (
  metadata: Metadata,
  fileContents: string
): ScriptMetadata => {
  if (metadata?.shortcut) {
    metadata.shortcut = shortcutNormalizer(
      metadata?.shortcut
    )

    metadata.friendlyShortcut = friendlyShortcut(
      metadata.shortcut
    )
  }

  if (metadata?.shortcode) {
    ;(metadata as unknown as ScriptMetadata).shortcode =
      metadata?.shortcode
        ?.split(" ")
        .map(sc => sc.trim().toLowerCase())
  }

  if (metadata?.image) {
    metadata.img = metadata?.image
  }

  if (metadata?.timeout) {
    ;(metadata as unknown as ScriptMetadata).timeout =
      parseInt(metadata?.timeout, 10)
  }

  if (metadata?.exclude) {
    ;(metadata as unknown as ScriptMetadata).exclude =
      Boolean(metadata?.exclude === "true")
  }

  metadata.type = metadata?.schedule
    ? ProcessType.Schedule
    : metadata?.watch
    ? ProcessType.Watch
    : metadata?.system
    ? ProcessType.System
    : metadata?.background
    ? ProcessType.Background
    : ProcessType.Prompt

  let tabs =
    fileContents.match(
      new RegExp(`(?<=^onTab[(]['"]).+?(?=['"])`, "gim")
    ) || []

  if (tabs?.length) {
    ;(metadata as unknown as ScriptMetadata).tabs = tabs
  }

  let hasFlags = Boolean(
    fileContents.match(
      new RegExp(`(?<=^setFlags).*`, "gim")
    )
  )

  if (hasFlags) {
    ;(metadata as unknown as ScriptMetadata).hasFlags = true
  }

  if (metadata?.log === "false") {
    ;(metadata as unknown as ScriptMetadata).log = "false"
  }

  let hasPreview = Boolean(
    fileContents.match(/preview(:|\s{0,1}=)/gi)?.[0]
  )
  if (hasPreview) {
    ;(metadata as unknown as ScriptMetadata).hasPreview =
      hasPreview
  }

  return metadata as unknown as ScriptMetadata
}

//app
export let parseMetadata = (
  fileContents: string
): ScriptMetadata => {
  let metadata: Metadata = getMetadata(fileContents)
  return formatScriptMetadata(metadata, fileContents)
}

//app
export let commandFromFilePath = (filePath: string) =>
  path.basename(filePath)?.replace(/\.(j|t)s$/, "") || ""

//app
export let iconFromKenv = async (kenv: string) => {
  let iconPath = kenv
    ? kenvPath("kenvs", kenv, "icon.png")
    : ""

  return kenv && (await isFile(iconPath)) ? iconPath : ""
}

//app
export let parseFilePath = async (
  filePath: string
): Promise<ScriptPathInfo> => {
  let command = commandFromFilePath(filePath)
  let kenv = kenvFromFilePath(filePath)
  let icon = await iconFromKenv(kenv)

  return {
    id: filePath,
    command,
    filePath,
    kenv,
    icon,
  }
}

// app
export let parseScript = async (
  filePath: string
): Promise<Script> => {
  let parsedFilePath = await parseFilePath(filePath)

  let contents = await readFile(filePath, "utf8")
  let metadata = parseMetadata(contents)

  return {
    ...metadata,
    ...parsedFilePath,
    name:
      metadata.name ||
      metadata.menu ||
      parsedFilePath.command,
    description: metadata.description
      ? metadata.description
      : metadata.name || metadata.menu
      ? parsedFilePath.command
      : "",
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

export let kenvFromFilePath = (filePath: string) => {
  let { dir } = path.parse(filePath)
  let { name: scriptsName, dir: kenvDir } = path.parse(dir)
  if (scriptsName !== "scripts") return ".kit"
  let { name: kenv } = path.parse(kenvDir)
  if (path.relative(kenvDir, kenvPath()) === "") return ""
  return kenv
}

//app
export let getLogFromScriptPath = (filePath: string) => {
  let { name, dir } = path.parse(filePath)
  let { name: scriptsName, dir: kenvDir } = path.parse(dir)
  if (scriptsName !== "scripts")
    return kitPath("logs", "kit.log")

  return path.resolve(kenvDir, "logs", `${name}.log`)
}

//new RegExp(`(^//([^(:|\W)]+

export let stripMetadata = (
  fileContents: string,
  exclude: string[] = []
) => {
  let negBehind = exclude.length
    ? `(?<!(${exclude.join("|")}))`
    : ``

  return fileContents.replace(
    new RegExp(`(^//[^(:|\W|\n)]+${negBehind}:).+`, "gim"),
    "$1"
  )
}

//validator
export let exists = async (input: string) => {
  return (await isBin(kenvPath("bin", input)))
    ? global.chalk`{red.bold ${input}} already exists. Try again:`
    : (await isDir(kenvPath("bin", input)))
    ? global.chalk`{red.bold ${input}} exists as group. Enter different name:`
    : (await isBin(input))
    ? global.chalk`{red.bold ${input}} is a system command. Enter different name:`
    : !input.match(/^([a-z]|[0-9]|\-|\/)+$/g)
    ? global.chalk`{red.bold ${input}} can only include lowercase, numbers, and -. Enter different name:`
    : true
}

export let toggleBackground = async (script: Script) => {
  let { tasks } = await global.getBackgroundTasks()

  let task = tasks.find(
    task => task.filePath === script.filePath
  )

  let toggleOrLog: "toggle" | "log" | "edit" =
    await global.arg(
      `${script.command} is ${
        task ? `running` : `stopped`
      }`,
      [
        {
          name: `${task ? `Stop` : `Start`} ${
            script.command
          }`,
          value: `toggle`,
          id: global.uuid(),
        },
        {
          name: `Edit ${script.command}`,
          value: `edit`,
          id: global.uuid(),
        },
        {
          name: `View ${script.command}.log`,
          value: `log`,
          id: global.uuid(),
        },
      ]
    )

  if (toggleOrLog === "toggle") {
    global.send(Channel.TOGGLE_BACKGROUND, script.filePath)
  }

  if (toggleOrLog === "edit") {
    await global.edit(script.filePath, kenvPath())
  }

  if (toggleOrLog === "log") {
    await global.edit(
      kenvPath("logs", `${script.command}.log`),
      kenvPath()
    )
  }
}

export let getKenvs = async (
  ignorePattern = /^ignore$/
): Promise<string[]> => {
  let kenvs: string[] = []
  if (!(await isDir(kenvPath("kenvs")))) return kenvs

  let dirs = await readdir(kenvPath("kenvs"), {
    withFileTypes: true,
  })

  return dirs
    .filter(d => !Boolean(d?.name?.match(ignorePattern)))
    .filter(d => d.isDirectory() || d.isSymbolicLink())
    .map(d => kenvPath("kenvs", d.name))
}

export let kitMode = () =>
  (process.env.KIT_MODE || "js").toLowerCase()

export let run = async (
  command: string,
  ...commandArgs: string[]
) => {
  let [script, ...scriptArgs] = command
    .split(/('[^']+?')|("[^"]+?")/)
    .filter(Boolean)
    .flatMap(item =>
      item.match(/'|"/)
        ? item.replace(/'|"/g, "")
        : item.trim().split(/\s/)
    )
  let resolvedScript = resolveToScriptPath(script)
  global.projectPath = (...args) =>
    path.resolve(
      path.dirname(path.dirname(script)),
      ...args
    )
  global.onTabs = []
  global.kitScript = resolvedScript
  global.kitCommand = resolveScriptToCommand(resolvedScript)

  if (process.env.KIT_CONTEXT === "app") {
    let script = await parseScript(global.kitScript)

    global.send(Channel.SET_SCRIPT, script)
  }

  return await global.attemptImport(
    resolvedScript,
    ...scriptArgs,
    ...commandArgs
  )
}

export let configEnv = () => {
  let { parsed, error } = config({
    path: process.env.KIT_DOTENV_PATH || kenvPath(),
    silent: true,
  })

  process.env.PATH =
    (parsed?.PATH || process.env.PATH) +
    path.delimiter +
    KIT_FIRST_PATH

  assignPropsTo(process.env, global.env)

  return parsed
}

export let trashScriptBin = async (script: Script) => {
  let { command, kenv, filePath } = script
  let { pathExists } = await import(
    "@johnlindquist/kit-internal/fs-extra"
  )

  let binJSPath = jsh
    ? kenvPath("node_modules", ".bin", command + ".js")
    : kenvPath(
        kenv && `kenvs/${kenv}`,
        "bin",
        command + ".js"
      )

  let binJS = await pathExists(binJSPath)
  let { name, dir } = path.parse(filePath)
  let commandBinPath = path.resolve(
    path.dirname(dir),
    "bin",
    name
  )

  if (binJS) {
    let binPath = jsh
      ? kenvPath("node_modules", ".bin", command)
      : commandBinPath

    await global.trash([
      binPath,
      ...(binJS ? [binJSPath] : []),
    ])
  }

  if (await pathExists(commandBinPath)) {
    await global.trash(commandBinPath)
  }
}

export let trashScript = async (script: Script) => {
  let { filePath } = script

  await trashScriptBin(script)

  let { pathExists } = await import(
    "@johnlindquist/kit-internal/fs-extra"
  )

  await global.trash([
    ...((await pathExists(filePath)) ? [filePath] : []),
  ])

  await wait(100)
}

export let getScriptFiles = async (kenv = kenvPath()) => {
  let scriptsPath = path.join(kenv, "scripts")
  if (!(await isDir(scriptsPath))) {
    return []
  }

  let result = await readdir(scriptsPath, {
    withFileTypes: true,
  })

  return result
    .filter(file => file.isFile())
    .map(file => file.name)
    .filter(name => name.match(/\.(mj|t|j)(s|sx)$/))
    .map(file => path.join(scriptsPath, file))
}

type Timestamp = { filePath: string; timestamp: number }
export let scriptsSort =
  (timestamps: Timestamp[]) => (a: Script, b: Script) => {
    let aTimestamp = timestamps.find(
      t => t.filePath === a.filePath
    )
    let bTimestamp = timestamps.find(
      t => t.filePath === b.filePath
    )

    if (aTimestamp && bTimestamp) {
      return bTimestamp.timestamp - aTimestamp.timestamp
    }

    if (aTimestamp) {
      return -1
    }

    if (bTimestamp) {
      return 1
    }

    if (a?.index || b?.index) {
      if ((a?.index || 9999) < (b?.index || 9999)) return -1
      else return 1
    }

    let aName = (a?.name || "").toLowerCase()
    let bName = (b?.name || "").toLowerCase()

    return aName > bName ? 1 : aName < bName ? -1 : 0
  }

export let parseScripts = async () => {
  let scriptFiles = await getScriptFiles()
  let kenvDirs = await getKenvs()
  for await (let kenvDir of kenvDirs) {
    let scripts = await getScriptFiles(kenvDir)
    scriptFiles = [...scriptFiles, ...scripts]
  }

  let scriptInfo = await Promise.all(
    scriptFiles.map(parseScript)
  )
  let timestamps = []
  try {
    let json = await global.readJson(timestampsPath)
    timestamps = json.stamps
  } catch {}
  return scriptInfo.sort(scriptsSort(timestamps))
}

export let isParentOfDir = (
  parent: string,
  dir: string
) => {
  let relative = path.relative(parent, dir)
  return (
    relative &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative)
  )
}

export let isInDir =
  (parentDir: string) => (dir: string) => {
    const relative = path.relative(parentDir, dir)
    return (
      relative &&
      !relative.startsWith("..") &&
      !path.isAbsolute(relative)
    )
  }

export let backToMainShortcut: Shortcut = {
  name: `Back`,
  key: `escape`,
  bar: "left",
  onPress: async () => {
    await mainScript()
  },
}

export let closeShortcut: Shortcut = {
  name: "Exit",
  key: `${cmd}+w`,
  bar: "right",
  onPress: () => {
    exit()
  },
}

export let editScriptShortcut: Shortcut = {
  name: "Edit Script",
  key: `${cmd}+o`,
  onPress: async (input, { script }) => {
    await run(
      kitPath("cli", "edit-script.js"),
      script?.filePath
    )
  },
  bar: "right",
}

export let submitShortcut: Shortcut = {
  name: "Submit",
  key: `${cmd}+s`,
  bar: "right",
  onPress: async input => {
    await submit(input)
  },
}

export let viewLogShortcut: Shortcut = {
  name: "View Log",
  key: `${cmd}+l`,
  onPress: async (input, { focused }) => {
    await run(
      kitPath("cli", "open-script-log.js"),
      focused?.value?.scriptPath
    )
  },
  bar: "right",
}

export let smallShortcuts: Shortcut[] = [
  backToMainShortcut,
  closeShortcut,
]

export let argShortcuts: Shortcut[] = [
  backToMainShortcut,
  closeShortcut,
  editScriptShortcut,
]

export let defaultShortcuts: Shortcut[] = [
  backToMainShortcut,
  closeShortcut,
  editScriptShortcut,
  submitShortcut,
]

export let divShortcuts: Shortcut[] = [
  backToMainShortcut,
  closeShortcut,
  {
    ...editScriptShortcut,
    bar: "",
  },
]

export let formShortcuts: Shortcut[] = [
  backToMainShortcut,
  {
    ...editScriptShortcut,
    bar: "",
  },
  closeShortcut,
  {
    name: "Reset",
    key: `${cmd}+alt+r`,
    bar: "",
  },
]

export let cliShortcuts: Shortcut[] = [
  backToMainShortcut,
  closeShortcut,
]
