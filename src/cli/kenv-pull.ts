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
      name: "Pull",
      key: `${cmd}+p`,
      bar: "right",
      onPress: async () => {
        term.write(`git pull`)
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
