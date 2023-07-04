// Description: Move script to different kenv

import { getKenvs, trashScriptBin } from "../core/utils.js"

import { createBinFromScript } from "./lib/utils.js"

import { Bin } from "../core/enum.js"
import { refreshScripts } from "../core/db.js"
import { Script } from "../types/core.js"

let script = await selectScript()

let kenvDirs = await getKenvs()

let selectedKenvDir = kenvPath()

selectedKenvDir = await arg(
  {
    placeholder: `Select target kenv`,
    hint: script.filePath,
  },
  [
    {
      name: "main",
      description: `Your main kenv: ${kenvPath()}`,
      value: kenvPath(),
    },
    ...kenvDirs.map(kenvDir => {
      return {
        name: path.basename(kenvDir),
        description: kenvDir,
        value: kenvDir,
      }
    }),
  ]
)

let exists = false
let target = filePath =>
  path.join(
    selectedKenvDir,
    "scripts",
    path.basename(filePath)
  )

while (true) {
  if (!script) {
    script = (await selectScript({
      placeholder: exists
        ? `Sorry, ${script.command} already exists. Pick another`
        : `Move another script to kenv?`,
      hint: selectedKenvDir,
    })) as Script
  }

  let targetPath = target(script.filePath)
  exists = await isFile(targetPath)

  if (!exists) {
    await trashScriptBin(script)
    mv(script.filePath, targetPath)
    await refreshScripts()
    createBinFromScript(Bin.scripts, script)
  }

  script = null
}

export {}
