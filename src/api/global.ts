import {
  assignPropsTo,
  home,
  isBin,
  isDir,
  isFile,
  kitPath,
  kenvPath,
  wait,
} from "../core/utils.js"

import { getScripts } from "../core/db.js"

global.getScripts = getScripts

await import("@johnlindquist/globals")
await import("./packages/clipboardy.js")
await import("./packages/node-notifier.js")
await import("./packages/shelljs.js")
await import("./packages/trash.js")

global.env = async (envKey, promptConfig) => {
  if ((promptConfig as any)?.reset !== true) {
    let envVal = global.env[envKey] || process.env[envKey]
    if (envVal) return envVal
  }

  let input =
    typeof promptConfig === "function"
      ? await promptConfig()
      : typeof promptConfig === "string"
      ? await global.kitPrompt({
          placeholder: promptConfig,
        })
      : await global.kitPrompt({
          placeholder: `Set ${envKey} to:`,
          ...promptConfig,
        })

  if (input.startsWith("~"))
    input = input.replace("~", home())

  await global.cli("set-env-var", envKey, input)
  global.env[envKey] = process.env[envKey] = input
  return input
}

assignPropsTo(process.env, global.env)

global.wait = wait
global.kitPath = kitPath
global.kenvPath = kenvPath
global.isBin = isBin
global.isDir = isDir
global.isFile = isFile
global.home = home

global.memoryMap = new Map()
