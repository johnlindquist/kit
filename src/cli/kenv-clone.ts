//Description: Clone a Kenv repo

import { getLastSlashSeparated } from "@core/util"

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

let panelContainer = content =>
  `<div class="p-4 break-all">${content}</div>`

let setPanelContainer = content => {
  setPanel(panelContainer(content))
}

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
    if (!input) {
      setPanelContainer(`A kenv name is required`)
    } else if (exists) {
      setPanelContainer(
        `A kenv named "${input}" already exists`
      )
    } else {
      setPanelContainer(
        `
        <p>Will clone to:</p>
        <p class="font-mono">${kenvPath(
          "kenvs",
          input
        )}</p>`
      )
    }
  }
)

let kenvDir = kenvPath("kenvs", kenvName)

await $`git clone ${repo} ${kenvDir}`
await getScripts(false)
await cli("create-all-bins")

export {}
