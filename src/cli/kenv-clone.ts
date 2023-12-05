//Description: Clone a Kenv repo

import { KIT_FIRST_PATH } from "../core/utils.js"

let initRepo = args?.[0]

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

## Remove .git Folder

Type "y" if you want to clear the .git information from this repo so you can freely make changes or prevent accidental pulls/pushes.

## Accept Risks and Proceed with Download

If you understand and accept the risks associated with downloading these scripts, type "ok" and press "Enter" to continue with the download. 
Hit "escape" to cancel.`

  return md(html)
}

let prevRepoName = ""
setPauseResize(true)
setBounds({
  height: PROMPT.HEIGHT["4XL"],
})
let [repo, kenvName, removeGit, install, ok] = await fields(
  {
    height: PROMPT.HEIGHT["4XL"],
    ignoreBlur: true,
    preview: buildPreview(),
    enter: "",
    onInit: async () => {
      if (initRepo) {
        let repo = initRepo
        let kenvName = path.basename(repo)
        if (kenvName === ".kenv" || kenvName === "kenv") {
          kenvName =
            path.basename(path.dirname(repo)) + "-kenv"
        }
        setFormData({
          repo,
          kenvName,
        })

        setPreview(buildPreview(repo))
      }
    },
    onChange: async (i, s) => {
      let [repo, kenvName, removeGit, install, ok] =
        s?.value
      if (ok === "ok" && kenvName) {
        if (removeGit === "y") {
          setEnter(`Clone ${kenvName} and Remove .git`)
        } else {
          setEnter(`Clone ${kenvName}`)
        }
      }

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
      if (newName === ".kenv" || newName === "kenv") {
        newName =
          path.basename(path.dirname(repo)) + "-kenv"
      }
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
        label: "Remove .git folder y/n",
        name: "Remove git ",
        placeholder: `y/n`,
        value: "n",
      },
      {
        label: "Install Dependencies from package.json y/n",
        name: "Install Dependencies",
        placeholder: `y/n`,
        value: "y",
      },
      {
        label: "Accept Risks and Proceed with Download",
        placeholder: "ok",
        required: true,
      },
    ],
  }
)

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

setPauseResize(false)

let termPreview = md(`# Please Wait...

Attempting to automatically clone ${repo} to ${kenvDir} and remove the .git folder using [degit](https://github.com/Rich-Harris/degit).

> If this fails, please clone the repo manually and then run \`kit kenv trust ${kenvName}\` to trust the scripts in this repo.
`)
if (removeGit === "y") {
  await term({
    command: `npx degit ${repo} ${kenvDir}`,
    preview: termPreview,
  })
} else {
  await term({
    command: `git clone ${repo} ${kenvDir}`,
    preview: termPreview,
  })
}

// check if package.json exists
let packageJsonPath = kenvPath(
  "kenvs",
  kenvName,
  "package.json"
)

if (await isFile(packageJsonPath)) {
  const json = await readJson(packageJsonPath)
  if (json?.dependencies || json?.devDependencies) {
    if (install === "y") {
      let tool = `npm${global.isWin ? `.cmd` : ``}`
      let command = "install"
      let toolPath = `${knodePath("bin", tool)}`

      await term({
        name: ``,
        description: `Cloning ${repo}`,
        height: PROMPT.HEIGHT["BASE"],
        command: `${toolPath} ${command}`,
        env: {
          ...global.env,
          PATH: KIT_FIRST_PATH,
        },
        cwd: kenvDir,
      })
    }
  }
}

await getScripts(false)

await cli("kenv-trust", kenvName)

await mainScript()
export {}
