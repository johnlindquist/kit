// Description: Git Pull Kenv Repo

import { selectKenv } from "../core/utils.js"

let { dirPath: kPath } = await selectKenv()

console.log({ kPath })

await $`cd ${kPath} && git stash && git pull`

await getScripts(false)

// Prompt if stash exists to re-apply changes

export {}
