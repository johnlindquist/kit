//Description: Clone a Kenv repo

let kenvsDir = kenvPath("kenvs")

if (!(await isDir(kenvsDir))) {
  mkdir("-p", kenvsDir)
}

// TODO: Better example kenvs

let panel = md(`### Full url or \`user/repo\` for github

### Examples
* [\`johnlindquist/kit-examples\`](submit:johnlindquist/kit-examples)
* [\`https://github.com/johnlindquist/kit-examples\`](submit:https://github.com/johnlindquist/kit-examples)

`)
// TODO: Move to a single command
let repo = await arg({
  placeholder: `Enter url to kenv repo`,
  ignoreBlur: true,
  panel,
})

if (repo?.match(/^[^\/|:]*\/[^\/]*$/)) {
  repo = `https://github.com/${repo}`
}

let input =
  repo.replace(/\.git$/, "").match(/(?<=\/)[^\/]+$/)[0] ||
  ""

let validate = async input => {
  let exists = await isDir(kenvPath("kenvs", input))
  if (exists) {
    return `${input} already exists`
  }

  return true
}

let onInput = async input => {
  let exists = await isDir(kenvPath("kenvs", input))
  let panel = !input
    ? md(`### ⚠️ A kenv name is required`)
    : exists
    ? md(`### ⚠️ A kenv named "${input}" already exists`)
    : md(`### Will clone to:
\`${kenvPath("kenvs", input)}\``)
  setPanel(panel)
}

let kenvName = await arg({
  placeholder: `Enter a kenv name`,
  input,
  validate,
  onInput,
})

let kenvDir = kenvPath("kenvs", kenvName)

await exec(`git clone ${repo} ${kenvDir}`)

await cli("create-all-bins")

await mainScript()

export {}
