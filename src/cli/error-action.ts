//Description: An error has occurred

import { extensionRegex } from "../core/utils.js"
import { ErrorAction } from "../core/enum.js"

let script = await arg()
let stackFile = await arg()
let errorFile = await arg()
let line = await arg()
let col = await arg()

let stack = await readFile(stackFile, "utf-8")

stack = stack.replace(/\?uuid.*/g, "")

let errorLog = `${path
  .basename(errorFile)
  .replace(extensionRegex, "")}.log`

let errorLogPath = kenvPath("logs", errorLog)

let errorActions: {
  [key in ErrorAction]: () => Promise<void>
} = {
  [ErrorAction.Open]: async () => {
    edit(errorFile, kenvPath(), line, col)
  },
  [ErrorAction.KitLog]: async () => {
    edit(kitPath("logs", "kit.log"), kenvPath())
  },
  [ErrorAction.Log]: async () => {
    edit(errorLogPath, kenvPath())
  },
  [ErrorAction.Ask]: async () => {
    copy(stack)
    exec(
      `open "https://github.com/johnlindquist/kit/discussions/categories/errors"`
    )
  },
  [ErrorAction.CopySyncPath]: async () => {
    await cli("sync-path-instructions")
  },
}

console.log(stack)

let hint = stack.split("\n")[0]
let showCopyCommand = false
if (hint?.includes("command not found")) {
  showCopyCommand = true
  hint = `${hint}.<br/><br/>
Running "~/.kit/bin/kit sync-path" in the terminal may help find expected commands.`
}

let errorAction: ErrorAction = await arg(
  {
    placeholder: `🤕 Error in ${script}`,
    ignoreBlur: true,
    hint,
  },
  [
    ...(showCopyCommand
      ? [
          {
            name: "Copy 'sync-path' command to clipboard",
            value: ErrorAction.CopySyncPath,
          },
        ]
      : []),
    {
      name: `Open ${script} in editor`,
      value: ErrorAction.Open,
    },
    {
      name: `Open ${errorLog} in editor`,
      value: ErrorAction.Log,
    },
    {
      name: `Open log kit.log in editor`,
      value: ErrorAction.KitLog,
    },
    {
      name: `Ask for help on forum`,
      description: `Copy error to clipboard and open discussions in browser`,
      value: ErrorAction.Ask,
    },
  ]
)

await errorActions[errorAction]()

export {}
