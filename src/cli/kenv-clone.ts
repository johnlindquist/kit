//Description: Clone a Kenv repo

let kenvsDir = kenvPath("kenvs")

if (!(await isDir(kenvsDir))) {
  mkdir("-p", kenvsDir)
}

let repo = await arg({
  placeholder: `Enter url to kenv repo`,
  ignoreBlur: true,
  hint: `Full url or "user/repo" for github: e.g., <code>johnlindquist/kit-examples</code>`,
})

if (repo?.match(/^[^\/|:]*\/[^\/]*$/)) {
  repo = `https://github.com/${repo}`
}

let input =
  repo.replace(/\.git$/, "").match(/(?<=\/)[^\/]+$/)[0] ||
  ""

let kenvName = await arg(
  {
    placeholder: `Enter a kenv name`,
    input,
    hint: md(`
<div class="text-xs">

<kbd>Enter</kbd> to accept suggested kenv name 

<div>${input}</div>

Or type a different name

<div>
    `),
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

    return `<div class="p-5">${panel}<div>`
  }
)

let kenvDir = kenvPath("kenvs", kenvName)

await exec(`git clone ${repo} ${kenvDir}`)
await getScripts(false)
await cli("create-all-bins")

await mainScript()

export {}
