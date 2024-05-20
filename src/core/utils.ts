import { randomUUID as uuid } from "crypto"
import { config } from "@johnlindquist/kit-internal/dotenv-flow"
import * as path from "path"
import untildify from "untildify"
import {
  Script,
  ScriptPathInfo,
  ScriptMetadata,
  Metadata,
  Shortcut,
  Choice,
} from "../types/core"
import { platform, homedir } from "os"
import { lstatSync, PathLike, realpathSync } from "fs"
import {
  access,
  lstat,
  readdir,
  readFile,
} from "fs/promises"
import { constants } from "fs"
import { execSync } from "child_process"

import { ProcessType, Channel, PROMPT } from "./enum.js"
import { Parser, type Program } from "acorn"
import tsPlugin from "acorn-typescript"

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
    await access(file, constants.F_OK)
    let stats = await lstat(file).catch(() => null)
    return stats?.isFile()
  } catch {
    return false
  }
}

//app
export let isDir = async (
  dir: string
): Promise<boolean> => {
  try {
    try {
      let stats = await lstat(dir)

      return stats.isDirectory()
    } catch (error) {
      log(error)
    }

    return false
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
  return process.env.KIT_DOTENV_PATH || kenvPath(".env")
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
export const statsPath = kitPath("db", "stats.json")
export const prefsPath = kitPath("db", "prefs.json")
export const promptDbPath = kitPath("db", "prompt.json")
export const themeDbPath = kitPath("db", "theme.json")
export const userDbPath = kitPath("db", "user.json")
export const tmpClipboardDir = kitPath("tmp", "clipboard")
export const tmpDownloadsDir = kitPath("tmp", "downloads")

export const getMainScriptPath = () => {
  const version = process.env?.KIT_MAIN_SCRIPT
  return kitPath(
    "main",
    `index${version ? `-${version}` : ""}.js`
  )
}
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
export const KIT_APP_INDEX = kitPath("run", "app-index.js")
export let combinePath = (
  arrayOfPaths: string[]
): string => {
  const pathSet = new Set<string>()

  for (const p of arrayOfPaths) {
    if (p) {
      const paths = p.split(path.delimiter)
      for (const singlePath of paths) {
        if (singlePath) {
          pathSet.add(singlePath)
        }
      }
    }
  }

  return Array.from(pathSet).join(path.delimiter)
}

const UNIX_DEFAULT_PATH = combinePath([
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
  "/usr/sbin",
  "/sbin",
])

const WIN_DEFAULT_PATH = combinePath([])

export const KIT_DEFAULT_PATH = isWin
  ? WIN_DEFAULT_PATH
  : UNIX_DEFAULT_PATH

export const KIT_BIN_PATHS = combinePath([
  knodePath("bin"),
  kitPath("bin"),
  ...(isWin ? [] : [kitPath("override", "code")]),
  kenvPath("bin"),
])

export const KIT_FIRST_PATH = combinePath([
  KIT_BIN_PATHS,
  process?.env?.PATH,
  KIT_DEFAULT_PATH,
])

export const KIT_LAST_PATH = combinePath([
  process.env.PATH,
  KIT_DEFAULT_PATH,
  KIT_BIN_PATHS,
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
  if (fileExists(script)) return script

  // Check sibling scripts
  if (global.kitScript) {
    let currentRealScriptPath = realpathSync(
      global.kitScript
    )
    let maybeSiblingScriptPath = path.join(
      path.dirname(currentRealScriptPath),
      script
    )
    if (fileExists(maybeSiblingScriptPath)) {
      return maybeSiblingScriptPath
    }

    if (fileExists(maybeSiblingScriptPath + ".js")) {
      return maybeSiblingScriptPath + ".js"
    }

    if (fileExists(maybeSiblingScriptPath + ".ts")) {
      return maybeSiblingScriptPath + ".ts"
    }
  }

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
        .replace(
          /(option|opt|alt)/i,
          isMac ? "Option" : "Alt"
        )
        .replace(/(ctl|cntrl|ctrl|control)/, "Control")
        .replace(
          /(command|cmd)/i,
          isMac ? "Command" : "Control"
        )
        .replace(/(shift|shft)/i, "Shift")
        .split(/\s/)
        .filter(Boolean)
        .map(part =>
          (part[0].toUpperCase() + part.slice(1)).trim()
        )
        .join("+")
    : ""

export const friendlyShortcut = (shortcut: string) => {
  let f = ""
  if (shortcut.includes("Command+")) f += "cmd+"
  if (shortcut.match(/(?<!Or)Control\+/)) f += "ctrl+"
  if (shortcut.includes("Alt+")) f += "alt+"
  if (shortcut.includes("Option+")) f += "opt+"
  if (shortcut.includes("Shift+")) f += "shift+"
  if (shortcut.includes("+"))
    f += shortcut.split("+").pop()?.toLowerCase()

  return f
}

export let setMetadata = (
  contents: string,
  overrides: {
    [key: string]: string
  }
) => {
  Object.entries(overrides).forEach(([key, value]) => {
    let k = key[0].toUpperCase() + key.slice(1)
    // if not exists, then add
    if (
      !contents.match(
        new RegExp(`^\/\/\\s*(${key}|${k}):.*`, "gm")
      )
    ) {
      // uppercase first letter
      contents = `// ${k}: ${value}
${contents}`.trim()
    } else {
      // if exists, then replace
      contents = contents.replace(
        new RegExp(`^\/\/\\s*(${key}|${k}):.*$`, "gm"),
        `// ${k}: ${value}`
      )
    }
  })
  return contents
}

const getMetadataFromComments = (contents: string) : Record<string, string> => {
  const lines = contents.split("\n")
  const metadata = {}
  let commentStyle = null
  let spaceRegex = null
  let inMultilineComment = false
  let multilineCommentEnd = null

  const setCommentStyle = (style: string) => {
    commentStyle = style
    spaceRegex = new RegExp(`^${commentStyle} ?[^ ]`)
  }

  for (const line of lines) {
    // Check for the start of a multiline comment block
    if (
      !inMultilineComment &&
      (line.trim().startsWith("/*") ||
        line.trim().startsWith("'''") ||
        line.trim().startsWith('"""') ||
        line.trim().match(/^: '/))
    ) {
      inMultilineComment = true
      multilineCommentEnd = line.trim().startsWith("/*")
        ? "*/"
        : line.trim().startsWith(": '")
          ? "'"
          : line.trim().startsWith("'''")
            ? "'''"
            : '"""'
    }

    // Check for the end of a multiline comment block
    if (
      inMultilineComment &&
      line.trim().endsWith(multilineCommentEnd)
    ) {
      inMultilineComment = false
      multilineCommentEnd = null
      continue // Skip the end line of a multiline comment block
    }

    // Skip lines that are part of a multiline comment block
    if (inMultilineComment) continue

    // Determine the comment style based on the first encountered comment line
    if (commentStyle === null) {
      if (
        line.startsWith("//") &&
        (line[2] === " " || /[a-zA-Z]/.test(line[2]))
      ) {
        setCommentStyle("//")
      } else if (
        line.startsWith("#") &&
        (line[1] === " " || /[a-zA-Z]/.test(line[1]))
      ) {
        setCommentStyle("#")
      }
    }

    // Skip lines that don't start with the determined comment style
    if (
      commentStyle === null ||
      (commentStyle && !line.startsWith(commentStyle))
    )
      continue

    // Check for 0 or 1 space after the comment style
    if (!line.match(spaceRegex)) continue

    // Find the index of the first colon
    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) continue

    // Extract key and value based on the colon index
    let key = line
      .substring(commentStyle.length, colonIndex)
      .trim()

    if (key?.length > 0) {
      key = key[0].toLowerCase() + key.slice(1)
    }
    const value = line.substring(colonIndex + 1).trim()

    // Skip empty keys or values
    if (!key || !value) {
      continue
    }

    let parsedValue: string | boolean | number;
    switch (true) {
      case value.toLowerCase() === 'true':
        parsedValue = true
        break
      case value.toLowerCase() === 'false':
        parsedValue = false
        break
      case key.toLowerCase() === 'timeout':
        parsedValue = parseInt(value, 10)
        break
      default:
        parsedValue = value
    }

    // Only assign if the key hasn't been assigned before
    if (!(key in metadata)) {
      metadata[key] = parsedValue
    }
  }

  return metadata
}


function parseTypeScript(code: string) {
  // @ts-expect-error Somehow these are not 100% compatible
  const parser = Parser.extend(tsPlugin({ allowSatisfies: true }))
  return parser.parse(code, { sourceType: "module", ecmaVersion: "latest" })
}

function getMetadataFromExport(ast: Program): Partial<Metadata> {
  function isOfType<T extends { type: string }, TType extends string>(node: T, type: TType): node is T & { type: TType } {
    return node.type === type
  }

  for (const node of ast.body) {
    if (!isOfType(node, "ExportNamedDeclaration") || !node.declaration) {
      continue
    }

    const declaration = node.declaration

    if (declaration.type !== "VariableDeclaration" || !declaration.declarations[0]) {
      continue
    }

    const namedExport = declaration.declarations[0]

    if (!("name" in namedExport.id) || namedExport.id.name !== "metadata") {
      continue
    }

    if (namedExport.init?.type !== "ObjectExpression") {
      continue
    }

    const properties = namedExport.init?.properties

    return properties.reduce((acc, prop) => {
      if (!isOfType(prop, "Property")) {
        throw Error("Not a Property")
      }

      const key = prop.key
      const value = prop.value

      if (!isOfType(key, "Identifier")) {
        throw Error("Key is not an Identifier")
      }

      if (!isOfType(value, "Literal")) {
        throw Error(`value is not a Literal, but a ${value.type}`)
      }

      acc[key.name] = value.value
      return acc
    }, {})
  }

  // Nothing found
  return {}
}

//app
export let getMetadata = (contents: string): Metadata => {
  const fromComments = getMetadataFromComments(contents)

  if (!/(const|var|let) metadata/g.test(contents)) {
    // No named export in file, return early
    return fromComments
  }

  let ast: Program
  try {
    ast = parseTypeScript(contents)
  } catch(err) {
    // TODO: May wanna introduce some error handling here. In my script version, I automatically added an error
    //  message near the top of the user's file, indicating that their input couldn't be parsed...
    //  acorn-typescript unfortunately doesn't support very modern syntax, like `const T` generics.
    //  But it works in most cases.
    return fromComments
  }

  try {
    const fromExport = getMetadataFromExport(ast)
    return {...fromComments, ...fromExport}
  } catch(err) {
    return fromComments
  }
}

const shebangRegex = /^#!(.+)/m

export let getShebangFromContents = (
  contents: string
): string | undefined => {
  let match = contents.match(shebangRegex)
  return match ? match[1].trim() : undefined
}

//app
export let postprocessMetadata = (
  metadata: Metadata,
  fileContents: string
): ScriptMetadata => {
  const result: Partial<ScriptMetadata> = { ...metadata }

  if (metadata.shortcut) {
    result.shortcut = shortcutNormalizer(
      metadata.shortcut
    )

    result.friendlyShortcut = friendlyShortcut(
      metadata.shortcut
    )
  }

  if (metadata.shortcode) {
    result.shortcode = metadata.shortcode?.trim()?.toLowerCase()
  }

  if (metadata.trigger) {
    result.trigger = metadata.trigger?.trim()?.toLowerCase()
  }

  // An alias brings the script to the top of the list
  if (metadata.alias) {
    result.alias = metadata.alias?.trim().toLowerCase()
  }

  if (metadata.image) {
    result.img = untildify(metadata.image)
  }

  result.type = metadata.schedule
    ? ProcessType.Schedule
    : result?.watch
    ? ProcessType.Watch
    : result?.system
    ? ProcessType.System
    : result?.background
    ? ProcessType.Background
    : ProcessType.Prompt

  let tabs =
    fileContents.match(
      new RegExp(`(?<=^onTab[(]['"]).+?(?=['"])`, "gim")
    ) || []

  if (tabs?.length) {
    result.tabs = tabs
  }

  result.hasFlags = Boolean(
    fileContents.match(
      new RegExp(`(?<=^setFlags).*`, "gim")
    )
  )

  result.hasPreview = Boolean(
    fileContents.match(/preview(:|\s{0,1}=)/gi)?.[0]
  )

  return result as unknown as ScriptMetadata
}

//app
export let parseMetadata = (
  fileContents: string
): ScriptMetadata => {
  let metadata: Metadata = getMetadata(fileContents)
  return postprocessMetadata(metadata, fileContents)
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

  let shebang = getShebangFromContents(contents)

  let needsDebugger = Boolean(
    contents.match(/^\s*debugger/gim)
  )

  let result = {
    shebang,
    ...metadata,
    ...parsedFilePath,
    needsDebugger,
    name:
      metadata.name ||
      metadata.menu ||
      parsedFilePath.command,
    description: metadata.description || "",
  }

  return result
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
  let excludeWithCommon = [
    `http`,
    `https`,
    `TODO`,
    `FIXME`,
    `NOTE`,
  ].concat(exclude)

  let negBehind = exclude.length
    ? `(?<!(${excludeWithCommon.join("|")}))`
    : ``

  return fileContents.replace(
    new RegExp(`(^//[^(:|\W|\n)]+${negBehind}:).+`, "gim"),
    "$1"
  )
}

export let stripName = (name: string) => {
  let strippedName = path.parse(name).name
  strippedName = strippedName
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
  strippedName = strippedName.replace(/[^\w-]+/g, "")
  strippedName = strippedName.replace(/-{2,}/g, "-")
  return strippedName
}

//validator
export let checkIfCommandExists = async (input: string) => {
  if (await isBin(kenvPath("bin", input))) {
    return global.chalk`{red.bold ${input}} already exists. Try again:`
  }

  if (await isDir(kenvPath("bin", input))) {
    return global.chalk`{red.bold ${input}} exists as group. Enter different name:`
  }

  if (await isBin(input)) {
    return global.chalk`{red.bold ${input}} is a system command. Enter different name:`
  }

  if (!input.match(/^([a-z]|[0-9]|\-|\/)+$/g)) {
    return global.chalk`{red.bold ${input}} can only include lowercase, numbers, and -. Enter different name:`
  }

  return true
}

export let getKenvs = async (
  ignorePattern = /^ignore$/
): Promise<string[]> => {
  if (!(await isDir(kenvPath("kenvs")))) return []

  let dirs = await readdir(kenvPath("kenvs"), {
    withFileTypes: true,
  })

  let kenvs = []
  for (let dir of dirs) {
    if (
      !dir.name.match(ignorePattern) &&
      (dir.isDirectory() || dir.isSymbolicLink())
    ) {
      kenvs.push(kenvPath("kenvs", dir.name))
    }
  }

  return kenvs
}

export let kitMode = () =>
  (process.env.KIT_MODE || "ts").toLowerCase()

global.__kitRun = false

let kitGlobalRunCount = 0
export let run = async (
  command: string,
  ...commandArgs: string[]
) => {
  performance.mark("run")
  kitGlobalRunCount++
  let kitLocalRunCount = kitGlobalRunCount

  let scriptArgs = []
  let script = ""
  let match
  let splitRegex = /('[^']+?')|("[^"]+?")|\s+/
  let quoteRegex = /'|"/g
  let parts = command.split(splitRegex).filter(Boolean)

  for (let item of parts) {
    if (!script) {
      script = item.replace(quoteRegex, "")
    } else if (!item.match(quoteRegex)) {
      scriptArgs.push(...item.trim().split(/\s+/))
    } else {
      scriptArgs.push(item.replace(quoteRegex, ""))
    }
  }
  // In case a script is passed with a path, we want to use the full command
  if (script.includes(path.sep)) {
    script = command
    scriptArgs = []
  }
  let resolvedScript = resolveToScriptPath(script)
  global.projectPath = (...args) =>
    path.resolve(
      path.dirname(path.dirname(resolvedScript)),
      ...args
    )

  global.onTabs = []
  global.kitScript = resolvedScript
  global.kitCommand = resolveScriptToCommand(resolvedScript)
  let realProjectPath = projectPath()
  updateEnv(realProjectPath)
  if (process.env.KIT_CONTEXT === "app") {
    let script = await parseScript(global.kitScript)

    if (commandArgs.includes(`--${cmd}`)) {
      script.debug = true
      global.send(Channel.DEBUG_SCRIPT, script)

      return await Promise.resolve("Debugging...")
    }

    cd(realProjectPath)

    global.send(Channel.SET_SCRIPT, script)
  }

  let result = await global.attemptImport(
    resolvedScript,
    ...scriptArgs,
    ...commandArgs
  )

  global.flag.tab = ""

  return result
}

export let updateEnv = (scriptProjectPath: string) => {
  let { parsed, error } = config({
    node_env: process.env.NODE_ENV || "development",
    path: scriptProjectPath,
    silent: true,
  })

  if (parsed) {
    assignPropsTo(process.env, global.env)
  }

  if (error) {
    console.log(error)
  }
}

export let configEnv = () => {
  let { parsed, error } = config({
    node_env: process.env.NODE_ENV || "development",
    path: process.env.KIT_DOTENV_PATH || kenvPath(),
    silent: true,
  })

  process.env.PATH_FROM_DOTENV = combinePath([
    parsed?.PATH || process.env.PATH,
  ])

  process.env.PATH = combinePath([
    process.env.PARSED_PATH,
    KIT_FIRST_PATH,
  ])

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
  try {
    let dirEntries = await readdir(scriptsPath)
    let scriptFiles = []
    for (let fileName of dirEntries) {
      if (!fileName.startsWith(".")) {
        let fullPath = path.join(scriptsPath, fileName)
        if (!path.extname(fileName)) {
          try {
            let stats = await lstat(fullPath)
            if (!stats.isDirectory()) {
              scriptFiles.push(fullPath)
            }
          } catch (error) {
            log(error)
          }
        } else {
          scriptFiles.push(fullPath)
        }
      }
    }
    return scriptFiles
  } catch {
    return []
  }
}

export type Timestamp = {
  filePath: string
  timestamp: number
}
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

export let escapeShortcut: Shortcut = {
  name: `Exit`,
  key: `escape`,
  bar: "left",
  onPress: async () => {
    exit()
  },
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

export let shortcutsShortcut: Shortcut = {
  name: "Display Shortcuts",
  key: `${cmd}+/`,
  bar: "right",
  onPress: async () => {
    setAlwaysOnTop(true)
    let shortcutsList = ``
    ;(global?.kitShortcutsMap || new Map()).forEach(
      (name, shortcut) => {
        shortcutsList += `<div><span class="justify-center rounded py-0.5 px-1.5 text-sm text-primary text-opacity-90 bg-text-base bg-opacity-0 bg-opacity-10 font-medium">${shortcut}</span> - ${name}<div>`
      }
    )

    if (shortcutsList) {
      await widget(
        md(`## Shortcuts
      
${shortcutsList}`),
        {
          width: 274,
          draggable: true,
          containerClass: `bg-bg-base`,
          resizable: true,
          transparent: true,
        }
      )
    }
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
  visible: true,
}

export let terminateProcessShortcut: Shortcut = {
  name: "Terminate Process",
  key: `${cmd}+enter`,
  onPress: async (input, { focused }) => {
    await sendWait(
      Channel.TERMINATE_PROCESS,
      focused?.value?.pid
    )
  },
  bar: "right",
  visible: true,
}

export let terminateAllProcessesShortcut: Shortcut = {
  name: "Terminate All Processes",
  key: `${cmd}+shift+enter`,
  onPress: async () => {
    await sendWait(Channel.TERMINATE_ALL_PROCESSES)
  },
  bar: "right",
  visible: true,
}

export let smallShortcuts: Shortcut[] = [
  // escapeShortcut,
  closeShortcut,
]

export let argShortcuts: Shortcut[] = [
  // escapeShortcut,
  closeShortcut,
  editScriptShortcut,
]

export let editorShortcuts: Shortcut[] = [
  closeShortcut,
  editScriptShortcut,
  submitShortcut,
]

export let defaultShortcuts: Shortcut[] = [
  // escapeShortcut,
  closeShortcut,
  editScriptShortcut,
  submitShortcut,
]

export let divShortcuts: Shortcut[] = [
  // escapeShortcut,
  closeShortcut,
  {
    ...editScriptShortcut,
    bar: "",
  },
]

export let formShortcuts: Shortcut[] = [
  // escapeShortcut,
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
  // escapeShortcut,
  closeShortcut,
]

export let proPane = () =>
  `
<h2 class="pb-1 text-xl">⭐️ Pro Account</h2>
<a href="submit:pro" class="shadow-xl shadow-primary/25 text-bg-base font-bold px-3 py-3 h-6 no-underline rounded bg-primary bg-opacity-100 hover:opacity-80">Unlock All Features ($7/m.)</a>

<div class="py-1"></div>
<div class="flex justify-evenly">

<div class="list-inside">

## Pro Features

- Debugger
- Script Log Window
- Support through Discord

</div>

<div>

## Upcoming Pro Features

- Sync Scripts to GitHub Repo
- Run Script Remotely as GitHub Actions
- Advanced Widgets
- Screenshots
- Screen Recording
- Audio Recording
- Webcam Capture
- Desktop Color Picker
- Measure Tool

</div>
</div>
`

export const getShellSeparator = () => {
  let separator = "&&"
  if (process.platform === "win32") {
    separator = "&"
  }
  // if powershell
  if (
    process.env.KIT_SHELL?.includes("pwsh") ||
    process.env.KIT_SHELL?.includes("powershell") ||
    process.env.SHELL?.includes("pwsh") ||
    process.env.SHELL?.includes("powershell") ||
    process.env.ComSpec?.includes("powershell") ||
    process.env.ComSpec?.includes("pwsh")
  ) {
    separator = ";"
  }

  if (
    process.env.KIT_SHELL?.includes("fish") ||
    process.env.SHELL?.includes("fish")
  ) {
    separator = ";"
  }

  return separator
}

export let getTrustedKenvsKey = () => {
  let username =
    process.env?.USER ||
    process.env?.USERNAME ||
    "NO_USER_ENV_FOUND"

  let formattedUsername = username
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toUpperCase()

  let trustedKenvKey = `KIT_${formattedUsername}_DANGEROUSLY_TRUST_KENVS`

  return trustedKenvKey
}

export const uniq = (array: any[]): any[] => {
  if (!Array.isArray(array)) {
    throw new Error("Input should be an array")
  }
  return [...new Set(array)]
}

interface DebounceSettings {
  leading?: boolean
  trailing?: boolean
}

type Procedure = (...args: any[]) => void

type DebouncedFunc<T extends Procedure> = (
  ...args: Parameters<T>
) => void

export const debounce = <T extends Procedure>(
  func: T,
  waitMilliseconds = 0,
  options: DebounceSettings = {}
): DebouncedFunc<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return (...args: Parameters<T>) => {
    const doLater = () => {
      timeoutId = undefined
      // If trailing is enabled, we invoke the function only if the function was invoked during the wait period
      if (options.trailing !== false) {
        func(...args)
      }
    }

    const shouldCallNow =
      options.leading && timeoutId === undefined

    // Always clear the timeout
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(doLater, waitMilliseconds)

    // If leading is enabled and no function call has been scheduled, we call the function immediately
    if (shouldCallNow) {
      func(...args)
    }
  }
}

export const range = (
  start: number,
  end: number,
  step = 1
): number[] => {
  return Array.from(
    { length: Math.ceil((end - start) / step) },
    (_, i) => start + i * step
  )
}

type Iteratee<T> = ((item: T) => any) | keyof T

export let sortBy = <T>(
  collection: T[],
  iteratees: Iteratee<T>[]
): T[] => {
  const iterateeFuncs = iteratees.map(iteratee =>
    typeof iteratee === "function"
      ? iteratee
      : (item: T) => item[iteratee as keyof T]
  )

  return [...collection].sort((a, b) => {
    for (const iteratee of iterateeFuncs) {
      const valueA = iteratee(a)
      const valueB = iteratee(b)

      if (valueA < valueB) {
        return -1
      } else if (valueA > valueB) {
        return 1
      }
    }

    return 0
  })
}

export let isUndefined = (
  value: any
): value is undefined => {
  return value === undefined
}

export let isString = (value: any): value is string => {
  return typeof value === "string"
}

export let groupChoices = (
  choices: Choice[],
  options = {}
) => {
  let {
    groupKey,
    missingGroupName,
    order,
    endOrder,
    sortChoicesKey,
    recentKey,
    recentLimit,
    hideWithoutInput,
    excludeGroups,
    tagger,
  } = {
    groupKey: "group",
    missingGroupName: "No Group",
    order: [],
    endOrder: [],
    sortChoicesKey: [],
    hideWithoutInput: [],
    recentKey: "",
    recentLimit: 3,
    excludeGroups: [],
    tagger: null,
    ...options,
  }

  // A group is a choice with a group key and "choices" array
  let groups = []
  let missingGroup

  let recentGroup = {
    // Initialize the Recent group
    skip: true,
    group: "Recent",
    name: "Recent",
    value: "Recent",
    choices: [],
  }

  let passGroup = {
    skip: true,
    pass: true,
    group: "Pass",
    value: "Pass",
    name: 'Pass "{input}" to...',
    choices: [],
  }

  let putIntoGroups = (choice: Choice) => {
    if (tagger) tagger(choice)
    if (
      excludeGroups.find(
        c =>
          choice?.group === c ||
          (choice as Script)?.kenv === c
      )
    ) {
      choice.exclude = true
    }
    if (choice?.pass) {
      choice.group = "Pass"
      if (!choice.previewPath) {
        choice.preview = `<div></div>`
      }
      passGroup.choices.push(choice)
    } else if (
      !Boolean(choice?.group) &&
      !Boolean(choice?.[groupKey])
    ) {
      choice.group = missingGroupName
      if (missingGroup) {
        missingGroup.choices.push(choice)
      } else {
        missingGroup = {
          skip: true,
          id: `group-${missingGroupName}-${choice.id}`,
          group: missingGroupName,
          name: missingGroupName,
          value: missingGroupName,
          choices: [choice],
        }
        groups.push(missingGroup)
      }
    } else {
      let groupParent: { choices: Choice[] }
      if (choice?.group) {
        groupParent = groups.find(
          g => g?.group === choice?.group
        )
      } else {
        groupParent = groups.find(
          g => g?.group === choice?.[groupKey]
        )
      }
      let userGrouped = choice?.group ? true : false
      choice.group ||= choice[groupKey]
      let group = choice.group

      choice.hideWithoutInput ||=
        hideWithoutInput.includes(group)
      if (groupParent) {
        groupParent.choices.push(choice)
      } else {
        groups.push({
          skip: true,
          userGrouped,
          id: `group-${group}-${choice.id}`,
          group,
          name: group,
          value: group,
          choices: [choice],
          hideWithoutInput:
            hideWithoutInput.includes(group),
        })
      }
    }
  }

  for (let choice of choices) {
    if (
      choice[recentKey] &&
      !choice.pass &&
      !(
        typeof choice?.recent === "boolean" &&
        choice?.recent === false
      )
    ) {
      // TODO: Implement "recentLimit" number to the most recent choices
      // If choice is recent, add to the Recent group
      recentGroup.choices.push(choice)
      continue // Skip to next iteration of loop
    }

    // sort recentGroup.choices by recentKey
    recentGroup.choices = recentGroup.choices.sort(
      (a, b) => {
        if (a?.[recentKey] < b?.[recentKey]) return 1
        if (a?.[recentKey] > b?.[recentKey]) return -1
        return 0
      }
    )

    let unrecentGroup
    if (recentGroup.choices.length > recentLimit) {
      // If recentGroup.choices is longer than recentLimit
      // split into recentGroup and unrecentGroup
      unrecentGroup = recentGroup.choices.splice(
        recentLimit,
        recentGroup.choices.length - recentLimit
      )
    }

    if (unrecentGroup) {
      for (let unrecentChoice of unrecentGroup) {
        putIntoGroups(unrecentChoice)
      }
    }

    putIntoGroups(choice)
  }

  let lowerOrder = order.map(o => o.toLowerCase())
  let lowerEndOrder = endOrder.map(o => o.toLowerCase())

  groups.sort((a: Choice, b: Choice) => {
    let aGroup = a.group.toLowerCase()
    let bGroup = b.group.toLowerCase()
    let aOrder = lowerOrder.indexOf(aGroup)
    let bOrder = lowerOrder.indexOf(bGroup)
    let endAOrder = lowerEndOrder.indexOf(aGroup)
    let endBOrder = lowerEndOrder.indexOf(bGroup)

    // If both elements are in the order array, sort them as per the order array
    if (aOrder !== -1 && bOrder !== -1)
      return aOrder - bOrder

    // If a is in the order array, or b is in the endOrder array, a comes first
    if (aOrder !== -1 || endBOrder !== -1) return -1

    // If b is in the order array, or a is in the endOrder array, b comes first
    if (bOrder !== -1 || endAOrder !== -1) return 1

    // If both elements are in the endOrder array, sort them as per the endOrder array
    if (endAOrder !== -1 && endBOrder !== -1)
      return endAOrder - endBOrder

    // Sort "userGrouped" "true" before "false"
    if (a.userGrouped && !b.userGrouped) return -1
    if (!a.userGrouped && b.userGrouped) return 1

    // If neither are in the order or endOrder arrays, and not differentiated by userGrouped, sort them alphabetically
    return aGroup.localeCompare(bGroup)
  })

  // if missingGroupName === "No Group", then move it to the end
  if (missingGroupName === "No Group") {
    let noGroupIndex = groups.findIndex(
      g => g.name === missingGroupName
    )
    if (noGroupIndex > -1) {
      let noGroup = groups.splice(noGroupIndex, 1)
      groups.push(noGroup[0])
    }
  }

  groups = groups.map((g, i) => {
    const maybeKey = sortChoicesKey?.[i]
    const sortKey =
      typeof maybeKey === "boolean" && maybeKey === false
        ? false
        : typeof maybeKey === "string"
        ? maybeKey
        : "name"

    if (sortKey) {
      g.choices = g.choices.sort((a, b) => {
        if (a?.[sortKey] < b?.[sortKey]) return -1
        if (a?.[sortKey] > b?.[sortKey]) return 1

        return 0
      })
    }

    if (Boolean(g?.choices?.[0]?.preview)) {
      g.preview = g.choices[0].preview
      g.hasPreview = true
    }

    return g
  })

  if (recentGroup.choices.length > 0) {
    recentGroup.choices = recentGroup.choices.sort(
      (a, b) => {
        if (a?.[recentKey] < b?.[recentKey]) return 1
        if (a?.[recentKey] > b?.[recentKey]) return -1
        return 0
      }
    )
    groups.unshift(recentGroup)
  }

  if (passGroup.choices.length > 0) {
    groups.push(passGroup)
  }

  return groups
}

export let defaultGroupClassName = `border-t-1 border-t-ui-border`
export let defaultGroupNameClassName = `font-medium text-xxs text-text-base/60 uppercase`

export let formatChoices = (
  choices: Choice[],
  className = ""
): Choice[] => {
  if (Array.isArray(choices)) {
    return (choices as Choice<any>[]).flatMap(
      (choice, index) => {
        const isChoiceObject = typeof choice === "object"

        if (!isChoiceObject) {
          let name = String(choice)
          let slicedName = (choice as string).slice(0, 63)
          return {
            name,
            slicedName,
            value: choice,
            id: `${index}-${slicedName}`,
            hasPreview: false,
            className,
          }
        }

        let hasPreview = Boolean(choice?.preview)
        let slicedName = choice?.name?.slice(0, 63) || ""
        let properChoice = {
          hasPreview,
          id: choice?.id || `${index}-${slicedName || ""}`,
          name: choice?.name || "",
          slicedName,
          slicedDescription:
            choice?.description?.slice(0, 63) || "",
          value: choice?.value || choice,
          nameClassName: choice?.info ? "text-primary" : "",
          skip: choice?.info ? true : false,
          className:
            choice?.className || choice?.choices
              ? ""
              : className,

          ...choice,
        }

        if (properChoice.height > PROMPT.ITEM.HEIGHT.XXL) {
          properChoice.height = PROMPT.ITEM.HEIGHT.XXL
        }
        if (properChoice.height < PROMPT.ITEM.HEIGHT.XXXS) {
          properChoice.height = PROMPT.ITEM.HEIGHT.XXXS
        }

        const choiceChoices = properChoice?.choices
        if (!choiceChoices) {
          return properChoice
        }

        delete properChoice.choices

        let isArray = Array.isArray(choiceChoices)
        if (!isArray) {
          throw new Error(
            `Group choices must be an array. Received ${typeof choiceChoices}`
          )
        }

        let groupedChoices = []

        properChoice.group = properChoice.name
        properChoice.skip =
          typeof choice?.skip === "undefined"
            ? true
            : choice.skip
        properChoice.className ||= defaultGroupClassName
        properChoice.nameClassName ||=
          defaultGroupNameClassName
        properChoice.height ||= PROMPT.ITEM.HEIGHT.XXXS

        groupedChoices.push(properChoice)

        choiceChoices.forEach(subChoice => {
          if (typeof subChoice === "undefined") {
            throw new Error(
              `Undefined choice in ${properChoice.name}`
            )
          }

          if (typeof subChoice === "object") {
            groupedChoices.push({
              name: subChoice?.name,
              slicedName:
                subChoice?.name?.slice(0, 63) || "",
              slicedDescription:
                subChoice?.description?.slice(0, 63) || "",
              value: subChoice?.value || subChoice,
              id: subChoice?.id || uuid(),
              group: choice?.name,
              className,
              hasPreview: Boolean(subChoice?.preview),
              ...subChoice,
            })
          } else {
            groupedChoices.push({
              name: String(subChoice),
              value: String(subChoice),
              slicedName:
                String(subChoice)?.slice(0, 63) || "",
              slicedDescription: "",
              group: choice?.name,
              className,
              id: uuid(),
            })
          }
        })

        return groupedChoices
      }
    )
  } else if (Boolean(choices)) {
    throw new Error(
      `Choices must be an array. Received ${typeof choices}`
    )
  }
}

export let getCachePath = (
  filePath: string,
  type: string
) => {
  // Normalize file path
  const normalizedPath = path.normalize(filePath)

  // Replace all non-alphanumeric characters and path separators with dashes
  let dashedName = normalizedPath.replace(
    /[^a-zA-Z0-9]/g,
    "-"
  )

  // Remove leading dashes
  while (dashedName.charAt(0) === "-") {
    dashedName = dashedName.substr(1)
  }

  // Replace multiple consecutive dashes with a single dash
  dashedName = dashedName.replace(/-+/g, "-")

  // Append .json extension
  return kitPath(`cache`, type, `${dashedName}.json`)
}

export let adjustPackageName = (packageName: string) => {
  let adjustedPackageName = ""
  if (packageName.startsWith("@")) {
    let parts = packageName.split("/")
    adjustedPackageName = `${parts[0]}/${parts[1]}`
  } else {
    adjustedPackageName = packageName.split("/")[0]
  }

  return adjustedPackageName
}

export let keywordInputTransformer = (keyword: string) => {
  if (!keyword) return (input: string) => input

  let keywordRegex = new RegExp(
    `(?<=${global.arg.keyword}\\s)(.*)`,
    "gi"
  )

  return (input: string) => {
    return input.match(keywordRegex)?.[0] || ""
  }
}

export let escapeHTML = (text: string) => {
  // Handle null or undefined input
  if (!text || typeof text !== "string") return ""

  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }

  // Perform HTML escape on the updated text
  text = text.replace(/[&<>"']/g, function (m) {
    return map[m]
  })

  // Convert tabs to spaces
  text = text.replace(/\t/g, "    ")

  // Convert newline characters to <br/>
  return text.replace(/\n/g, "<br/>")
}

export let processInBatches = async <T>(
  items: Promise<T>[],
  batchSize: number
): Promise<T[]> => {
  let result: T[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch)
    result = result.concat(batchResults)
  }
  return result
}
