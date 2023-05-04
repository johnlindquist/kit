// Description: Delete a Kenv Repo

import {
  getLastSlashSeparated,
  getKenvs,
} from "../core/utils.js"

import { rimraf } from "rimraf"

let dir = await arg(
  "Remove which kenv",
  (
    await getKenvs()
  ).map(value => ({
    name: getLastSlashSeparated(value, 1),
    value,
  }))
)
if (!dir.includes(path.sep)) {
  dir = kenvPath("kenvs", dir)
}

await rimraf(dir)

await getScripts(false)

if (process.env.KIT_CONTEXT === "app") {
  await mainScript()
}
