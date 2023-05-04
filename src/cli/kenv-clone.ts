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

if (process?.env?.KIT_TRUST_KENVS !== "true") {
  let message = await arg(
    {
      placeholder: `Type "ok" and hit enter to continue...`,
      strict: true,
      name: "",
      description: `Clone ${kenvName}`,
      shortcuts: [
        {
          name: "Cancel",
          key: "escape",
          bar: "right",
          onPress: () => process.exit(),
        },
      ],
      enter: `Clone to ${kenvName}`,
    },
    md(
      `
## Caution: This Action Will Download Scripts from the Internet

> Before proceeding, please review the scripts folder here: [${repo}](${repo})

Running scripts from the internet poses significant risks. Scripts have the ability to:

- Delete, modify, or steal your files
- Watch keystrokes and register key commands
- Start background processes and much more...

## Any Doubts? Ask for Help!

If you are unsure about the safety of this script, please ask the community for help before proceeding:

> [Get Help on GitHub](https://github.com/johnlindquist/kit/discussions/categories/q-a)
>
> [Get Help on Discord](https://discord.gg/8nRPzK9t)

## Accept Risks and Proceed with Download

If you understand and accept the risks associated with downloading these scripts, type "ok" and press "Enter" to continue with the download. 
Hit "escape" to cancel.
  `.trim()
    )
  )

  if (message !== "ok") {
    process.exit()
  }
}
let kenvDir = kenvPath("kenvs", kenvName)
await exec(`git clone ${repo} ${kenvDir}`)
await cli("create-all-bins")
await run(kitPath("setup", "build-ts-scripts.js"))
await mainScript()
export {}
