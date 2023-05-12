// Description: Git Pull Kenv Repo

import { getKenvs } from "../core/utils.js"

let kenvs = (await getKenvs()).map(value => ({
  name: path.basename(value),
  value,
}))

kenvs.unshift({
  name: "main",
  value: kenvPath(),
})

let dir = await arg("Pull which kenv", kenvs)

cd(dir)

await term({
  command: `git fetch`,
  preview: md(`# Pulling a Kenv

> The terminal only ran "git fetch" to show you what changes are available.

You still need to run "get merge" to apply the changes.
  
  `),
  cwd: dir,
  shortcuts: [
    {
      name: "Stash",
      key: `${cmd}+s`,
      bar: "right",
      onPress: async () => {
        term.write(`git stash`)
      },
    },
    {
      name: "Merge",
      key: `${cmd}+m`,
      bar: "right",
      onPress: async () => {
        term.write(`git merge`)
      },
    },
    {
      name: "Exit",
      key: `${cmd}+w`,
      bar: "right",
      onPress: async () => {
        submit("")
      },
    },
  ],
})

await getScripts(false)

await mainScript()

export {}
