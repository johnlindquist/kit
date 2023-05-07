//Description: Clone a Kenv repo
let kenvsDir = kenvPath("kenvs")
if (!(await isDir(kenvsDir))) {
  await ensureDir(kenvsDir)
}

let isValidRepoOrUrl = string => {
  const regex =
    /^(?:(?:https?|git):\/\/(?:[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]+)+)\/|)([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})\/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})$/
  return regex.test(string)
}

let buildPreview = (repo = "") => {
  if (repo.split("/").length === 2) {
    repo = `https://github.com/${repo}`
  }
  let html = `# Caution: Do You Trust These Scripts? 👀

${
  repo
    ? `> Before proceeding, please review the scripts folder here: [${repo}](${repo})`
    : `> Enter a valid repo URL`
}
    
  Running scripts from the internet poses significant risks. Scripts have the ability to:
  
  - Delete, modify, or steal your files
  - Watch keystrokes and register key commands
  - Start background processes and much more...
  
  ## Any Doubts? Ask for Help!
  
  If you are unsure about the safety of these scripts, please ask the community for help before proceeding:
  
  > [Get Help on GitHub](https://github.com/johnlindquist/kit/discussions/categories/q-a)
  >
  > [Get Help on Discord](https://discord.gg/qnUX4XqJQd)
  
  ## Accept Risks and Proceed with Download
  
  If you understand and accept the risks associated with downloading these scripts, type "ok" and press "Enter" to continue with the download. 
  Hit "escape" to cancel.`

  return md(html)
}

let prevRepoName = ""
let [repo, kenvName, removeGit, ok] = await fields({
  ignoreBlur: true,
  preview: buildPreview(),
  onInit: async () => {
    if (args?.[0]) {
      let repo = args?.[0]
      setFormData({
        repo,
        kenvName: path.basename(repo),
      })

      setPreview(buildPreview(repo))
    }
  },
  onChange: async (i, s) => {
    let [repo, kenvName] = s?.value

    if (repo === prevRepoName) return
    let valid = isValidRepoOrUrl(repo)
    if (valid) {
      setPreview(buildPreview(repo))
    } else {
      setPreview(buildPreview())
    }
    if (!repo.split("/").at(-1)) return
    prevRepoName = repo
    let newName = path.basename(repo)
    if (!newName) return

    setFormData({
      kenvName: newName,
    })
  },
  fields: [
    {
      name: "repo",
      label: "Repo URL",
      placeholder: "johnlindquist/kenv-template",
      required: true,
    },
    {
      name: "kenvName",
      label: "Kenv Name",
      placeholder: "my-kenv",
      required: true,
    },
    {
      label: "Remove .git folder",
      name: "Remove git ",
      placeholder: `y/n`,
    },
    {
      label: "Trust these scripts?",
      placeholder: "ok",
      required: true,
    },
  ],
})

let kenvDir = kenvPath("kenvs", kenvName)

if (ok !== "ok") {
  div(
    md(`# Aborting...

You did not type "ok" to continue. Aborting...
    `)
  )

  await wait(2000)
  await cli("kenv-manage")
}

if (repo.split("/").length === 2) {
  repo = `https://github.com/${repo}`
}

let result = await div({
  html: md(`Cloning ${repo} to ${kenvDir}`),
  onInit: async () => {
    await wait(1000)
    try {
      if (removeGit === "y") {
        let kenvRepo = degit(repo)
        await kenvRepo.clone(kenvDir)
      } else {
        await git.clone(repo, kenvDir)
      }
      submit("done")
      log(`Cloned ${repo} to ${kenvDir}`)
    } catch (e) {
      warn(`Error cloning ${repo} to ${kenvDir}`)
      submit("error")
    }
  },
})

if (result === "error") {
  div(
    md(`# Error cloning ${repo} to ${kenvDir}

> Please check the logs
  `)
  )

  await wait(2000)
}

await getScripts(false)

await mainScript()
export {}
