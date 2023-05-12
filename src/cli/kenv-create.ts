if (process.env.KIT_CONTEXT === "app") {
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

    let body = md(
      `
> Note: Built-in clone uses the https Web URL.
>
> Private repos or SSH require the Terminal to clone

Once you've created the repo, the app will automatically run the following in the \`~/.kenv/kenvs\` folder:
~~~bash
git clone ${url} ${kenv}
~~~

## What's happening?

- The app is polling if the url exists every 2 seconds
- The process will timeout after 1 minute if the repo isn't created
    `.trim()
    )

    let html = `
    <style>.draggable {-webkit-app-region: drag;}</style>
    <div class="draggable h-screen w-screen flex flex-col pt-8 items-center text-text-base">
    <h1 class="text-3xl animate-pulse text-center -my-1">Checking if repo is ready...</h1>
    
    ${body}
    </div>`

    let { workArea } = await getActiveScreen()
    let { x, y, width } = workArea
    let xxs = {
      width: PROMPT.WIDTH.XS,
      height: PROMPT.HEIGHT.LG,
      x: width,
      y,
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
        {
          key: `${cmd}+t`,
          name: "Manaully Clone in Terminal",
          onPress: async () => {
            setTimeout(() => {
              term.write(
                `git clone https://github.com/johnlindquist/kenv-template ${kenv}`
              )
            }, 2000)
            await cli("kenv-term", kenvPath("kenvs"))
          },
          bar: "left",
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

        await wait(2000)
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
    await cli("kenv-trust", kenv, kenv)
    await div({
      enter: "Main Menu",
      shortcuts: [
        {
          name: `Open in Terminal`,
          key: `${cmd}+t`,
          onPress: async () => {
            await cli("kenv-term", newKenvPath)
          },
          bar: "right",
        },
      ],
      html: md(`# "${kenv}" kenv created
  
The next time you create a script, you'll be prompted to select a kenv.

${body}
    `),
    })
  } else {
    await div({
      enter: "Continue to Main Menu",
      html: md(`# "${kenv}" kenv Failed to Create

Please ask for help:

> [Get Help on GitHub](https://github.com/johnlindquist/kit/discussions/categories/q-a)
>
> [Get Help on Discord](https://discord.gg/qnUX4XqJQd)
      `),
    })
  }

  if (process.env.KIT_CONTEXT === "app") {
    await mainScript()
  }
} else {
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
}

export {}
