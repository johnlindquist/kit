import {
  assignPropsTo,
  home,
  isBin,
  isDir,
  isFile,
  kitPath,
  kenvPath,
  wait,
  getLogFromScriptPath,
  createPathResolver,
} from "../core/utils.js"

import "../globals/index.js"

import { getScripts } from "../core/db.js"
import type { PromptConfig } from "../types/core"
import {
  format,
  formatDistanceToNow,
} from "../utils/date.js"
import { kitPnpmPath } from "../core/resolvers.js"

global.actionFlag = ""
global.getScripts = getScripts

performance.mark("run")

await import("../globals/index.js")
// await import("./packages/zx.js")
await import("./packages/clipboardy.js")
await import("./packages/shelljs.js")
await import("./packages/trash.js")
await import("./packages/open.js")
await import("./packages/tmpPromise.js")
await import("./packages/git.js")
await import("./packages/onepassword.js")

global.env = async (envKey, promptConfig) => {
  if (!envKey) throw new Error(`Environment Key Required`)

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
        ? await global.mini({
          enter: "Write to .env",
          shortcuts: [],
          placeholder: promptConfig,
          secret,
          keyword: "",
        })
        : await global.mini({
          enter: "Write to .env",
          shortcuts: [],
          placeholder: `Set ${envKey}:`,
          ...promptConfig,
          secret,
          keyword: "",
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
global.kitPnpmPath = kitPnpmPath
global.kenvPath = kenvPath
global.isBin = isBin
global.isDir = isDir
global.createPathResolver = createPathResolver
global.isFile = isFile
global.home = home

global.memoryMap = new Map()

global.getLog = () => {
  let log = getLogFromScriptPath(global.kitScript)
  return log
}

let intervals

// A proxy around setInterval that keeps track of all intervals
global.setInterval = new Proxy(setInterval, {
  apply: (
    target,
    thisArg,
    args: Parameters<typeof setInterval>
  ) => {
    let id = target(...args)
    intervals = intervals || new Set()
    intervals.add(id)
    return id
  },
})

let timeouts

global.setTimeout = new Proxy(setTimeout, {
  apply: (
    target,
    thisArg,
    args: Parameters<typeof setTimeout>
  ) => {
    let id = target(...args)
    timeouts = timeouts || new Set()
    timeouts.add(id)
    return id
  },
})

global.clearAllIntervals = () => {
  intervals?.forEach(id => clearInterval(id))
  intervals = new Set()
}

global.clearAllTimeouts = () => {
  timeouts?.forEach(id => clearTimeout(id))
  timeouts = new Set()
}

global.formatDate = format
global.formatDateToNow = formatDistanceToNow
