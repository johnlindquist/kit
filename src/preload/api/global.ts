import { LoDashStatic } from "lodash"
import { Options } from "trash"
import { assignPropsTo } from "../utils"

let globalApi = {
  cd: "shelljs",
  cp: "shelljs",
  chmod: "shelljs",
  echo: "shelljs",
  exec: "shelljs",
  exit: "shelljs",
  grep: "shelljs",
  ln: "shelljs",
  ls: "shelljs",
  mkdir: "shelljs",
  mv: "shelljs",
  sed: "shelljs",
  tempdir: "shelljs",
  test: "shelljs",
  which: "shelljs",
  spawn: "child_process",
  spawnSync: "child_process",
  fork: "child_process",
  get: "axios",
  put: "axios",
  post: "axios",
  patch: "axios",
  readFile: "fs/promises",
  writeFile: "fs/promises",
  appendFile: "fs/promises",
  createWriteStream: "fs",
  readdir: "fs/promises",
  compile: "handlebars",
}

global.cwd = process.cwd
global.pid = process.pid
global.stderr = process.stderr
global.stdin = process.stdin
global.stdout = process.stdout
global.uptime = process.uptime

Object.entries(globalApi).forEach(([key, value]) => {
  global[key] = (...args: any) => {
    return require(value)[key](...args)
  }
})

global.path = require("path")

global._ = new Proxy(
  {},
  {
    get(_o, p) {
      return require("lodash")[p]
    },
  }
) as LoDashStatic

global.uuid = (...args: any) => require("uuid").v4(...args)
global.chalk = (...text: unknown[]) =>
  require("chalk")(...text)

global.paste = (...args: any) =>
  require("clipboardy").read(...args)
global.copy = (...args: any) =>
  require("clipboardy").write(...args)

global.trash = async (
  input: string | readonly string[],
  options?: Options
) => {
  ;(typeof input === "string" ? [input] : input)
    .flatMap((x: any) => x)
    .forEach((trashArg: any) => {
      echo(
        global.chalk`{yellow ${trashArg}} moved to {yellow trash}`
      )
    })
  return await require("trash")(input, options)
}

global.rm = async (
  input: string | readonly string[],
  options?: Options
) => {
  echo(
    global.chalk`{yellow rm} doesn't exist. You're probably looking for {yellow trash}`
  )
  await global.trash(input, options)
}

global.wait = async (time: number) =>
  new Promise(res => setTimeout(res, time))

global.checkProcess = (pid: string | number) => {
  let { stdout, stderr } = exec(`kill -0 ` + pid)
  //if running, stdout has text. If not, stdout is an empty string
  return stdout
}

global.home = (...pathParts) => {
  let path = require("path")
  let os = require("os")
  return path.resolve(os.homedir(), ...pathParts)
}

global.isFile = async file => test("-f", file)

global.isDir = async dir => test("-d", dir)

global.isBin = async bin =>
  Boolean(
    exec(`command -v ${bin}`, {
      silent: false,
    }).stdout
  )

// TODO: Strip out minimist
global.args = []

global.env = async (
  envKey,
  promptConfig = { placeholder: "" }
) => {
  if (global.env[envKey]) return global.env[envKey]

  let input = await global.kitPrompt({
    placeholder: `Set ${envKey} env to:`,
    ...promptConfig,
  })

  if (input.startsWith("~"))
    input = input.replace("~", global.env.HOME)

  await global.cli("set-env-var", envKey, input)
  global.env[envKey] = input
  return input
}

assignPropsTo(process.env, global.env)

global.env.KIT_BIN_FILE_PATH = process.argv[1]
global.env.KIT_SRC_NAME = process.argv[1]
  .split(global.env.KENV.split(global.path.sep).pop())
  .pop()

global.env.KIT_SCRIPT_NAME = global.env.KIT_SRC_NAME.replace(
  ".js",
  ""
)

global.kitPath = (...parts) =>
  global.path.join(global.env.KIT, ...parts)

global.kenvPath = (...parts: string[]) => {
  return global.path.join(
    global.env.KENV,
    ...parts.filter(Boolean)
  )
}

global.libPath = (...parts) =>
  global.path.join(global.kenvPath("lib"), ...parts)

global.kitScriptFromPath = path => {
  path = path.replace(global.kenvPath() + "/", "")
  path = path.replace(/\.js$/, "")
  return path
}

global.kitFromPath = path => {
  path = path.replace(global.env.KIT + "/", "")
  path = path.replace(/\.js$/, "")
  return path
}

global.kitScript = global.kitScriptFromPath(
  global.env.KIT_SCRIPT_NAME
)

global.db = (key: any, defaults: any) => {
  let low = require("lowdb")
  let FileSync = require("lowdb/adapters/FileSync")
  let _db = low(
    new FileSync(global.kenvPath("db", `${key}.json`))
  )

  _db._.mixin(require("lodash-id"))
  _db.defaults(defaults).write()

  return _db
}
