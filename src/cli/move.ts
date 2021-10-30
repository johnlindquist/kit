// Description: Move script to different kenv

import { selectScript, trashScript } from "../core/utils.js"

import { createBinFromScript } from "./lib/utils.js"

import { Bin } from "../core/enum.js"
import { refreshScriptsDb } from "../core/db.js"

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
    script = await selectScript({
      placeholder: exists
        ? `Sorry, ${script.command} already exists. Pick another`
        : `Move another script to kenv?`,
      hint: selectedKenvDir,
    })
  }

  exists = await isFile(target(script.filePath))

  if (!exists) {
    await trashScript(script)
    mv(script.filePath, target(script.filePath))
    await refreshScriptsDb()
    createBinFromScript(Bin.scripts, script)
  }

  script = null
}

export {}
