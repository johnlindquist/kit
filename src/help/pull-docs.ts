// Description: Git Pull Kenv Repo

import { kitDocsPath } from "../core/utils.js"

let docsExists = await pathExists(kitDocsPath)

if (docsExists) {
  await $`cd ${kitDocsPath} && git stash && git pull`
} else {
  await $`cd ${home()} && git clone https://github.com/johnlindquist/kit-docs.git .kit-docs`
}

// Prompt if stash exists to re-apply changes

export {}
