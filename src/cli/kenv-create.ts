// Description: Create New Kenv

let newKenvName = await arg(
  {
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
  async input => {
    let newKenvPath = kenvPath("kenvs", input)
    let exists = await isDir(newKenvPath)
    return md(
      !input
        ? `Please name your kit environment directory`
        : exists
        ? `A kenv named "${input}" already exists`
        : `<p>Create a kit environment here:</p>
    <p class="font-mono text-xxs break-all">${newKenvPath}</p>
    
<p>Next time you create a script, you will be prompted where to store it.</p>
    `
    )
  }
)

let newKenvPath = kenvPath("kenvs", newKenvName)

if (!newKenvPath) exit()
await ensureDir(kenvPath("kenvs"))

await degit(`johnlindquist/kenv-template`).clone(
  newKenvPath
)

export {}
