// Description: Remove a script

import { selectScript } from "../core/utils.js"

let command, filePath
let hint = command
  ? `Removed ${command}. Remove another?`
  : ``

;({ command, filePath } = await selectScript({
  placeholder: `Remove a script:`,
  hint,
}))

let confirm =
  global?.flag?.confirm ||
  (await arg(
    {
      placeholder: `Remove ${command}?`,
      hint: filePath,
    },
    [
      { name: "No, cancel.", value: false },
      { name: `Yes, remove ${command}`, value: true },
    ]
  ))

if (confirm) {
  let binJSPath = kenvPath("bin", command + ".js")
  let binJS = await pathExists(binJSPath)

  await trash([
    filePath,
    kenvPath("bin", command),
    ...(binJS ? [binJSPath] : []),
  ])
  await cli("refresh-scripts-db")
}

export {}
