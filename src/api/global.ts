import { homedir } from "os"
import { assignPropsTo } from "../utils.js"

global.cwd = process.cwd
global.pid = process.pid
global.stderr = process.stderr
global.stdin = process.stdin
global.stdout = process.stdout
global.uptime = process.uptime

global.path = await import("path")

await import("./packages/axios.js")
await import("./packages/chalk.js")
await import("./packages/clipboardy.js")
await import("./packages/child_process.js")
await import("./packages/degit.js")
await import("./packages/download.js")
await import("./packages/fs.js")
await import("./packages/fsPromises.js")
await import("./packages/handlebars.js")
await import("./packages/lodash.js")
await import("./packages/lowdb.js")
await import("./packages/marked.js")
await import("./packages/node-fetch.js")
await import("./packages/node-notifier.js")
await import("./packages/shelljs.js")
await import("./packages/trash.js")
await import("./packages/uuid.js")
await import("./packages/zx.js")

global.wait = async (time: number) =>
  new Promise(res => setTimeout(res, time))

global.checkProcess = (pid: string | number) => {
  let { stdout, stderr } = exec(`kill -0 ` + pid)
  //if running, stdout has text. If not, stdout is an empty string
  return stdout
}

global.home = (...pathParts) => {
  return path.resolve(homedir(), ...pathParts)
}

global.isFile = async file => test("-f", file)

global.isDir = async dir => test("-d", dir)

global.isBin = async bin =>
  Boolean(
    exec(`command -v ${bin}`, {
      silent: false,
    }).stdout
  )

global.env = async (envKey, promptConfig) => {
  if ((promptConfig as any)?.reset !== true) {
    if (global.env[envKey]) return global.env[envKey]
  }

  let input =
    typeof promptConfig === "function"
      ? await promptConfig()
      : await global.kitPrompt({
          placeholder: `Set ${envKey} to:`,
          ...promptConfig,
        })

  if (input.startsWith("~"))
    input = input.replace("~", home())

  await global.cli("set-env-var", envKey, input)
  global.env[envKey] = input
  return input
}

assignPropsTo(process.env, global.env)

global.kitPath = (...parts) =>
  global.path.join(process.env.KIT, ...parts)

global.kenvPath = (...parts: string[]) => {
  return global.path.join(
    global.env.KENV || home(".kenv"),
    ...parts.filter(Boolean)
  )
}

global.libPath = (...parts) =>
  global.path.join(global.kenvPath("lib"), ...parts)

global.memoryMap = new Map()
