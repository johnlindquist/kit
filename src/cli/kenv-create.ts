// Name: Better Kenv Create

import "@johnlindquist/kit"

import { getTrustedKenvsKey } from "../core/utils.js"
let trustedKenvsKey = getTrustedKenvsKey()

let buildPreview = async (kenv = "") => {
  let exists =
    kenv && (await isDir(kenvPath("kenvs", kenv)))

  if (exists) {
    setEnter("")
    return md(`
  # "${kenv}" kenv already exists

"${kenv}" already exists here:

~~~bash
${kenvPath("kenvs", kenv)}
~~~

Pick a different kenv name.

  `)
  }

  setEnter(`Create "${kenv}"`)

  return md(`  
# Create a "Kit Environment" AKA "kenv"

${
  kenv &&
  `Create the following kenv:

~~~bash
${kenvPath("kenvs", kenv)}
~~~

`
}

## What is a "kenv"?

> A "kenv" is a collection of scripts

## Where are my scripts?

Your scripts are stored in a \`scripts\` folder. When you create a kenv, you're creating a named folder with a \`scripts\` folder inside.

This folder structure allows the Script Kit app to watch for changes in the \`scripts\` folder and update the UI accordingly.

## "Main" kenv

Scripts for your "Main" kenv are located:

~~~bash
~/.kenv/scripts
~~~

## Additional kenvs

Additional kenvs are located:

~~~bash
~/.kenv/kenvs/<kenv-name>/scripts
~~~


  `)
}

let [kenv, init, username] = await fields({
  preview: await buildPreview(),
  enter: "",
  height: PROMPT.HEIGHT["3XL"],
  fields: [
    {
      name: "kenv",
      placeholder: `my-new-kenv`,
      label: `Name your kenv`,
    },
    {
      name: "init",
      placeholder: "y/n",
      label: `Initialize as a git repo?`,
    },
    {
      name: "remote",
      placeholder: "GitHub username",
      label: `Enter a GitHub username to set up a remote repo`,
    },
  ],
  input: "",
  placeholder: "Name of new kenv:",
  onChange: async (input, state) => {
    let [kenv, init, remote] = state.value
    let preview = await buildPreview(kenv)
    setPreview(preview)
  },
})

let newKenvPath = kenvPath("kenvs", kenv)
if (!newKenvPath) exit()
await ensureDir(kenvPath("kenvs"))

let noInit = init !== "y"

if (noInit) {
  let kenvRepo = degit(`johnlindquist/kenv-template`)
  await kenvRepo.clone(newKenvPath)
}

let noClone = init === "y" && !username

if (noClone) {
  let kenvRepo = degit(`johnlindquist/kenv-template`)
  await kenvRepo.clone(newKenvPath)
  await git.init(newKenvPath)
}

let yesClone = init === "y" && username

if (yesClone) {
  let url = `https://github.com/${username}/${kenv}`
  let response = null
  let createUrl = `https://github.com/new?name=${kenv}&description=Kit%20Environment&template_owner=johnlindquist&template_name=kenv-template`

  open(createUrl)

  let html = `
  <style>.draggable {-webkit-app-region: drag;}</style>
  <div class="-mt-10 draggable h-screen w-screen flex flex-col justify-center items-center text-text-base">
  <h1 class="text-3xl animate-pulse text-center pt-4">Waiting for user to create...</h1>
  <p class="font-mono text-center p-4 my-2">${url}</p>
  <p class="text-center">Polling every 2 seconds.</p> 
  <p class="text-center">Timeout after 1 minute.</p>
  </div>`

  let xxs = {
    width: PROMPT.WIDTH.XXS,
    height: PROMPT.HEIGHT.XS,
  }

  let attempt = 0
  let attemptLimit = 30

  await div({
    name: "Waiting for kenv repo to be created",
    enter: "",
    shortcuts: [
      {
        key: `${cmd}+o`,
        name: "Open URL",
        onPress: () => {
          open(createUrl)
        },
        bar: "right",
      },
    ],
    ignoreBlur: true,
    html,
    ...xxs,
    onInit: async () => {
      while (
        response?.status !== 200 &&
        attempt < attemptLimit
      ) {
        await wait(2000)
        try {
          response = await get(url)
        } catch (error) {}

        attempt++
      }

      submit("done")
    },
  })
  if (response?.status === 200) {
    await git.clone(url, newKenvPath)
  }
}

let body = ``
if (noInit) {
  body = `## "${kenv}" Not Initialized as a Git Repo
  
You can always do this yourself later in the terminal

## Open Kenv in Terminal

Kit Tab -> Manage Kenvs -> Open Kenv Directory in Terminal

  `
}

if (noClone) {
  body = `## "${kenv}" Initialized as a Git Repo

You can add a remote repo in the terminal

## Open Kenv in Terminal

Kit Tab -> Manage Kenvs -> Open Kenv Directory in Terminal
  `
}

if (yesClone) {
  body = `## Version Control

You can push/pull your kenv from the Kit tab -> Manage Kenvs`
}

let exists = await isDir(newKenvPath)
if (exists) {
  await div({
    enter: "Continue to Main Menu",
    html: md(`# "${kenv}" kenv created
  
The next time you create a script, you'll be prompted to select a kenv.

${body}
    `),
  })
} else {
  await div({
    enter: "Continue to Main Menu",
    html: md(`# "${kenv}" kenv not created

    Please ask for help:
    
    > [Get Help on GitHub](https://github.com/johnlindquist/kit/discussions/categories/q-a)
    >
    > [Get Help on Discord](https://discord.gg/qnUX4XqJQd)
      `),
  })
}

await cli("kenv-trust", kenv)

if (process.env.KIT_CONTEXT === "app") {
  await mainScript()
}
export {}
//# sourceMappingURL=kenv-create.js.map
