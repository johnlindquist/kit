// Description: Delete a Kenv Repo

import {
  getLastSlashSeparated,
  getKenvs,
} from "../core/utils.js"

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

await trash(dir)

await getScripts(false)

await mainScript()
