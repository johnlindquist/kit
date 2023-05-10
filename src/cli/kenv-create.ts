// Description: Create New Kenv

let noInput = `Please name your kit environment directory`

let onInput = async input => {
  let newKenvPath = kenvPath("kenvs", input)
  let exists = await isDir(newKenvPath)
  let panel = md(
    !input
      ? noInput
      : exists
      ? `## ⚠️ A kenv named \`${input}\` already exists`
      : `## Create a kit environment
\`${newKenvPath}\`
  
> Next time you create a script, you will be prompted to select a kit environment.`
  )
  setPanel(panel)
}

let newKenvName = await arg(
  {
    input: "",
    placeholder: "Name of new kenv:",
    validate: async input => {
      let attemptPath = kenvPath("kenvs", input)
      let exists = await isDir(attemptPath)
      if (exists) {
        return `${attemptPath} already exists...`
      }

      return true
    },
  },
  onInput
)

let newKenvPath = kenvPath("kenvs", newKenvName)

if (!newKenvPath) exit()
await ensureDir(kenvPath("kenvs"))

let kenvRepo = degit(`johnlindquist/kenv-template`)

await kenvRepo.clone(newKenvPath)

if (process.env.KIT_CONTEXT === "app") {
  await mainScript()
}
export {}
