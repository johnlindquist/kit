import {
  assignPropsTo,
  home,
  isBin,
  isDir,
  isFile,
  kitPath,
  kenvPath,
  wait,
  knodePath,
} from "../core/utils.js"

import { getScripts } from "../core/db.js"
import { PromptConfig } from "../types/core"

global.getScripts = getScripts

await import("@johnlindquist/globals")
await import("./packages/clipboardy.js")
await import("./packages/node-notifier.js")
await import("./packages/shelljs.js")
await import("./packages/trash.js")
await import("./packages/open.js")

global.env = async (envKey, promptConfig) => {
  if (!envKey) throw new Error(`Environment Key Required`)
  let ignoreBlur =
    (promptConfig as PromptConfig)?.ignoreBlur === false
      ? false
      : true
  let secret =
    typeof (promptConfig as PromptConfig)?.secret ===
    "boolean"
      ? (promptConfig as PromptConfig).secret
      : envKey.includes("KEY") ||
        envKey.includes("SECRET") ||
        envKey.includes("TOKEN")
      ? true
      : false
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
          ignoreBlur,
          secret,
        })
      : await global.kitPrompt({
          placeholder: `Set ${envKey}:`,
          ignoreBlur,
          ...promptConfig,
          secret,
        })

  if (input?.startsWith("~"))
    input = input.replace(/^~/, home())

  await global.cli("set-env-var", envKey, input)
  global.env[envKey] = process.env[envKey] = input
  return input
}

assignPropsTo(process.env, global.env)

global.wait = wait
global.kitPath = kitPath
global.kenvPath = kenvPath
global.knodePath = knodePath
global.isBin = isBin
global.isDir = isDir
global.isFile = isFile
global.home = home

global.memoryMap = new Map()
