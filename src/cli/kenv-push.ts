// Description: Git Push Kenv Repo

import {
  getLastSlashSeparated,
  getKenvs,
} from "../core/util.js"

let dir = await arg(
  "Push which kenv",
  (
    await getKenvs()
  ).map(value => ({
    name: getLastSlashSeparated(value, 1),
    value,
  }))
)

await $`cd ${dir} && git add . && git commit -m "pushed from Script Kit" && git push`

await getScripts(false)

// Prompt if stash exists to re-apply changes

export {}
