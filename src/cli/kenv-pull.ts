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

await exec(`git fetch`)

let { stdout: localBranch } = await exec(
  "git rev-parse --abbrev-ref HEAD"
)
let { stdout: remoteBranch } = await exec(
  `git config branch.${localBranch}.remote`
)

remoteBranch =
  remoteBranch.trim() + "/" + localBranch.trim()

let logCommand = `git log --oneline ${localBranch}..${remoteBranch}`
let { stdout: status, stderr } = await exec(logCommand)

status = status.trim()

if (stderr) {
  await div(
    md(`# Git Log Failed 🤔
  
~~~bash
${stderr.trim()}
~~~  
  `)
  )
  await mainScript()
}

if (status === "") {
  await div(md(`# No Commits to Pull 🤔`))

  await mainScript()
}

if (status) {
  // display status
  await arg(
    {
      placeholder: "Git Log. Continue?",
      enter: "Pull",
      shortcuts: [
        {
          key: "escape",
          name: "Cancel",
          bar: "right",
          onPress: async () => {
            process.exit()
          },
        },
      ],
    },
    md(`
All changes will be committed and pushed to the remote repo.

> ${dir}  

~~~bash
${status}
~~~

Continuing will run the following commands in the built-in terminal:
~~~js
git stash
git pull
~~~
  `)
  )

  await term({
    command: `git stash`,

    cwd: dir,
    enter: "Pull",
  })

  await term({
    command: `git pull`,
    cwd: dir,
    enter: "Back to Main Menu",
  })

  await getScripts(false)

  await mainScript()
} else {
  await div({
    enter: "Close",
    html: md(`
# Git Status Failed 🤔

> ${dir}

Is your kenv repo a git repo?

        `),
  })
}

export {}
