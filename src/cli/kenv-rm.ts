// Description: Delete a Kenv Repo

import {
  getLastSlashSeparated,
  getKenvs,
} from "../core/utils.js"

import { lstat, unlink } from "fs/promises"

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

// If dir is a symlink, delete the symlink, not the target
setDescription(`Are you sure?`)
try {
  const stats = await lstat(dir)
  if (stats.isSymbolicLink()) {
    await div(
      md(`# Are you sure?

Press "enter" to remove the symlink at ${dir}
    `)
    )
    await unlink(dir)
  } else {
    await div(
      md(`# Are you sure?
    
Press "enter" to permanently delete ${dir}`)
    )
    await rimraf(dir)
  }
} catch (error) {
  console.error(`Error while removing kenv: ${error}`)
}

await getScripts(false)

if (process.env.KIT_CONTEXT === "app") {
  await mainScript()
}
