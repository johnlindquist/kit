//Description: Clone a Kenv repo

import { getLastSlashSeparated } from "../core/util.js"

let kenvsDir = kenvPath("kenvs")

if (!(await isDir(kenvsDir))) {
  mkdir("-p", kenvsDir)
}

let repo = await arg({
  placeholder: `Enter url to kenv repo`,
  ignoreBlur: true,
})

let input = getLastSlashSeparated(repo, 2)
  .replace(/\.git|\./g, "")
  .replace(/\//g, "-")

let kenvName = await arg(
  {
    placeholder: `Enter a kenv name`,
    input,
    hint: `Enter a name for ${getLastSlashSeparated(
      repo,
      2
    )}`,
    validate: async input => {
      let exists = await isDir(kenvPath("kenvs", input))
      if (exists) {
        return `${input} already exists`
      }

      return true
    },
  },
  async input => {
    let exists = await isDir(kenvPath("kenvs", input))
    let panel = !input
      ? `A kenv name is required`
      : exists
      ? `A kenv named "${input}" already exists`
      : `
    <p>Will clone to:</p>
    <p class="font-mono text-xxs break-all">${kenvPath(
      "kenvs",
      input
    )}</p>`

    return {
      choices: [input],
      panel,
      className: `p-4`,
    }
  }
)

let kenvDir = kenvPath("kenvs", kenvName)

await $`git clone ${repo} ${kenvDir}`
await getScripts(false)
await cli("create-all-bins")

export {}
