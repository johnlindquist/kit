// Description: Delete a Kenv Repo

import { getKenvs } from "../core/utils.js"

import { lstat, unlink } from "fs/promises"

import { rimraf } from "rimraf"

let selectedKenvPath = await arg(
  "Remove which kenv",
  (
    await getKenvs()
  ).map(value => ({
    name: path.basename(value),
    value,
  }))
)
if (!selectedKenvPath.includes(path.sep)) {
  selectedKenvPath = kenvPath("kenvs", selectedKenvPath)
}

// If dir is a symlink, delete the symlink, not the target
setDescription(`Are you sure?`)
try {
  const stats = await lstat(selectedKenvPath)
  if (stats.isSymbolicLink()) {
    await div(
      md(`# Are you sure?

Press "enter" to remove the symlink at ${selectedKenvPath}
    `)
    )
    await unlink(selectedKenvPath)
  } else {
    await div(
      md(`# Are you sure?
    
Press "enter" to permanently delete ${selectedKenvPath}`)
    )
    await rimraf(selectedKenvPath)
  }
} catch (error) {
  console.error(`Error while removing kenv: ${error}`)
}

await getScripts(false)

let kenv = path.basename(selectedKenvPath)

let trustedKenvKey = `KIT_${
  process.env?.USER ||
  process.env?.USERNAME ||
  "NO_USER_ENV_FOUND"
}_DANGEROUSLY_TRUST_KENVS`

if (typeof process?.env?.[trustedKenvKey] === "string") {
  let newValue = process.env[trustedKenvKey]
    .split(",")
    .filter(Boolean)
    .filter(k => k !== kenv)
    .join(",")

  await global.cli("set-env-var", trustedKenvKey, newValue)
}

if (process.env.KIT_CONTEXT === "app") {
  await mainScript()
}
