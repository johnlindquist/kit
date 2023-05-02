//Description: Clone a Kenv repo
let kenvsDir = kenvPath("kenvs")
if (!(await isDir(kenvsDir))) {
  await ensureDir(kenvsDir)
}

// TODO: Better example kenvs
let panel = md(
  `
# Examples
* [\`johnlindquist/kit-examples\`](submit:johnlindquist/kit-examples)
* [\`https://github.com/johnlindquist/kit-examples\`](submit:https://github.com/johnlindquist/kit-examples)

`.trim()
)
// TODO: Move to a single command
let repo = await arg(
  {
    placeholder: `Enter url to kenv repo`,
    hint: `Enter url (or user/repo) to kenv repo`,
    ignoreBlur: true,
    resize: true,
  },
  panel
)
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
    ? md(`## ⚠️ A kenv name is required`)
    : exists
    ? md(`## ⚠️ A kenv named "${input}" already exists`)
    : md(`## Will clone to:
\`${kenvPath("kenvs", input)}\``)
  setPanel(panel)
}
let kenvName = await arg({
  placeholder: `Enter a kenv name`,
  hint: `Enter a directory name (defaults to repo name)`,
  input,
  resize: true,
  strict: false,
  validate,
  onInput,
})

let message = await arg(
  {
    placeholder: `Type "ok" and hit enter to continue...`,
    strict: true,
    shortcuts: [
      {
        name: "Abort",
        key: "escape",
        bar: "right",
        onPress: () => process.exit(),
      },
    ],
    enter: `Clone to ${kenvName}`,
  },
  md(`
## Attention: This Action Will Install Remote Scripts

> Review the scripts first: [${repo}](${repo})

Running scripts from the internet carries significant risks. These scripts have the potential to:

- Erase your files
- Transfer your files to an external server
- Gain control over your computer
- Execute various harmful actions

If you are aware of and accept the risks of these scripts, type "ok" and press "Enter" 
to proceed with installation. Any other input will cancel the installation.
  `)
)

if (message !== "ok") {
  process.exit()
}

let kenvDir = kenvPath("kenvs", kenvName)
await exec(`git clone ${repo} ${kenvDir}`)
await cli("create-all-bins")
await run(kitPath("setup", "build-ts-scripts.js"))
await mainScript()
export {}
