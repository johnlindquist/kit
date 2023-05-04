// Description: Git Push Kenv Repo

import { getKenvs } from "../core/utils.js"

let kenvs = (await getKenvs()).map(value => ({
  name: path.basename(value),
  value,
}))

kenvs.unshift({
  name: "main",
  value: kenvPath(),
})

let dir = await arg("Push which kenv", kenvs)

cd(dir)

await term({
  command: `git status`,
  cwd: dir,
})

await term({
  command: `git add .`,
  cwd: dir,
  enter: "Commit",
})

await term({
  command: `git commit -m "pushed from Script Kit"`,
  cwd: dir,
  enter: "Push",
})

await term({
  command: `git push`,
  cwd: dir,
})

await getScripts(false)

await mainScript()

// Prompt if stash exists to re-apply changes

export {}
