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
    let panel = !input
      ? `A kenv name is required`
      : exists
      ? `A kenv named "${input}" already exists`
      : `
    <p>Will create to:</p>
    <p class="font-mono text-xxs break-all">${newKenvPath}</p>`

    return {
      choices: [input],
      panel,
      className: `p-4`,
    }
  }
)

let newKenvPath = kenvPath("kenvs", newKenvName)

if (!newKenvPath) exit()
await ensureDir(kenvPath("kenvs"))

console.log({ newKenvPath })

await degit(`johnlindquist/kenv-template`).clone(
  newKenvPath
)

export {}
