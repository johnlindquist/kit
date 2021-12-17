// Description: Move script to different kenv

import { trashScriptBin } from "../core/utils.js"

import { createBinFromScript } from "./lib/utils.js"

import { Bin } from "../core/enum.js"
import { refreshScriptsDb } from "../core/db.js"
import { Script } from "../types/core.js"

let script = await selectScript()

let kenvDirs = (await readdir(kenvPath("kenvs"))) || []

let selectedKenvDir = kenvPath()

selectedKenvDir = await arg(
  {
    placeholder: `Select target kenv`,
    hint: script.filePath,
  },
  [
    {
      name: "home",
      description: `Your main kenv: ${kenvPath()}`,
      value: kenvPath(),
    },
    ...kenvDirs.map(kenvDir => {
      let value = kenvPath("kenvs", kenvDir)
      return {
        name: kenvDir,
        description: value,
        value,
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
    await refreshScriptsDb()
    createBinFromScript(Bin.scripts, script)
  }

  script = null
}

export {}
