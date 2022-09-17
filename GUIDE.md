# Script Kit Guide

## Creating Previews

Each choice in an `arg` can have an associated `preview`. Previews gracefully enhance from a string all the way up to multiple async functions that return strings based on choice.

You can toggle the preview pane open and closed with <kbd>cmd+P</kbd>

```js
// Just a string
await arg(
  "Select a fruit",
  md(`I recommend typing "Apple"`) // "md" converts strings to HTML
)
```

```js
// A function, takes typed "input", returns string
await arg("Select a fruit", input =>
  md(`You typed "${input}"`)
)
```

```js
// An async function, takes typed "input", returns string
// `hightlight` requires "async" takes markdown, applies code highlighting

await arg(
  "Select a fruit",
  async input =>
    await highlight(` 
~~~js
await arg("${input}")
~~~
  `)
)
```

```js
// A "preview" per choice
await arg("Select a fruit", [
  { name: "Apple", preview: `Apple, yum! 🍎` },
  { name: "Banana", preview: `Banana, yum too! 🍌` },
])
```

```js
// Async "preview" per choice
let preview = async ({ name, input }) =>
  await highlight(`
~~~js
// ${name}
await arg("${input}!")
~~~
`)
```

```js
//"input" param is required to switch prompt mode from "filter list" to "generate list"
await arg("Select a fruit", async input => {
  return [
    { name: `Apple ${input}`, preview },
    { name: `Banana ${input}`, preview },
  ]
})
```

```js
// Static preview with static choices
await arg(
  {
    preview: md(`
# Pick a fruit


  `),
  },
  ["Apple", "Banana", "Orange"]
)
```

```js
// Dynamic choices, static preview
await arg(
  {
    preview: async () =>
      await highlight(`
## This is just information

Usually to help you make a choice
  
Just type some text to see the choices update
`),
  },
  async input => {
    return Array.from({ length: 10 }).map(
      (_, i) => `${input} ${i}`
    )
  }
)
```

## Display HTML

Use the `div` method to display html.

```js
await div(`<h1>Hi</h1>`)
```

### Add Padding

The second argument of `div` allows you to add [tailwind](https://tailwindcss.com/) classes to the container of your html. For example, `p-5` will add a `padding: 1.25rem;` to the container.

```js
await div(`<h1>Hi</h1>`, `p-5`)
```

## Display Markdown

Pass a string of markdown to the `md` method. This will convert the markdown to html which you can then pass to the `div`

```js
let html = md(`
# Hi
`)
await div(html)
```

If you want to highlight your markdown, pass the markdown string to the `await highlight()` method:

```js
let html = await highlight(`
# Hi
`)
await div(html)
```

## Create a Widget

Use the `widget` method to spawn a new, persisting window that is disconnected from the script.

```js
await widget(`
<div class="bg-black text-white h-screen p-5">
    Hello there!
<div>

`)
```

## Set Options using Flags

To add an options menu to your choices, you must provide a `flags` object. If one of the keyboard shortcuts are hit, or the user selects the option, then the `flag` global will have the matching key from your flags set to `true`:

```js
let urls = [
  "https://scriptkit.com",
  "https://egghead.io",
  "https://johnlindquist.com",
]

let flags = {
  open: {
    name: "Open",
    shortcut: "cmd+o",
  },
  copy: {
    name: "Copy",
    shortcut: "cmd+c",
  },
}

let url = await arg(
  { placeholder: `Press 'right' to see menu`, flags },
  urls
)

if (flag?.open) {
  $`open ${url}`
} else if (flag?.copy) {
  copy(url)
} else {
  console.log(url)
}
```

Using the same script above, In the terminal, you would pass an open flag like so:

```bash
my-sites --open
```

## Store Simple JSON data with db

The `db` helpers reads/writes to json files in the `~/.kenv/db` directory. It's meant as a simple wrapper around common json operations.

```js
// Menu: Database Read/Write Example
// Description: Add/remove items from a list of fruit

let fruitDb = await db(["apple", "banana", "orange"])

// This will keep prompting until you hit Escape
while (true) {
  let fruitToAdd = await arg(
    {
      placeholder: "Add a fruit",
      //allows to submit input not in the list
      strict: false,
    },
    fruitDb.items
  )

  fruitDb.items.push(fruitToAdd)
  await fruitDb.write()

  let fruitToDelete = await arg(
    "Delete a fruit",
    fruitDb.items
  )

  fruitDb.items = fruitDb.items.filter(
    fruit => fruit !== fruitToDelete
  )

  await fruitDb.write()
}
```

[Open db-store in Script Kit](https://scriptkit.com/api/new?name=db-store&url=https://gist.githubusercontent.com/johnlindquist/a7cda43e196f6b6e38e4c66cba8cdb74/raw/8d93dc14970bac042763cb86b30456b32ba5fab7/db-store.js")

## Watch Files to Trigger Scripts

The `// Watch` metadata enables you to watch for changes to a file on your system.

### Watch a Single File

```js
// Name: Speak File
// Watch: ~/speak.txt

import "@johnlindquist/kit"

let speakPath = home("speak.txt")

try {
  let content = await readFile(speakPath, "utf-8")
  if (content.length < 60) {
    // We don't want `say` to run too long 😅
    say(content)
  }
} catch (error) {
  log(error)
}
```

[Open speak-file in Script Kit](https://scriptkit.com/api/new?name=speak-file&url=https://gist.githubusercontent.com/johnlindquist/ec65920283c6ef66429a2331cdc81539/raw/98584e1ee1cb6b5f4f235a6873bdfcb709dfb953/speak-file.js")

### Watch a Directory

The `// Watch` metadata uses [Chokidar](https://www.npmjs.com/package/chokidar) under the hood, so it supports the same glob patterns. Please use cautiously, as this can cause a lot of scripts to run at once.

```js
// Name: Download Log
// Watch: ~/Downloads/*

import "@johnlindquist/kit"

// These are optional and automatically set by the watcher
let filePath = await arg()
let event = await arg()

if (event === "add") {
  await appendFile(home("download.log"), filePath + "\n")
}
```

[Open download-log in Script Kit](https://scriptkit.com/api/new?name=download-log&url=https://gist.githubusercontent.com/johnlindquist/395ced3283e44c8ed2fea885104a1346/raw/e9b03ddfb0ae969d2b82e45c41ac8680ea2e686b/download-log.js")

## Run Shell Commands

### Use zx to Run Shell Commands

Script Kit bundles [zx](https://github.com/google/zx) as the global `$`

Here's an example from their docs (make sure to `cd` to the proper dir)

```js
await $`cat package.json | grep name`

let branch = await $`git branch --show-current`
await $`dep deploy --branch=${branch}`

await Promise.all([
  $`sleep 1; echo 1`,
  $`sleep 2; echo 2`,
  $`sleep 3; echo 3`,
])

let name = "foo bar"
await $`mkdir /tmp/${name}`
```

## Make HTTP Requests with get, put, post, and del

The `get`, `post`, `put`, and `del` methods use the [axios](https://www.npmjs.com/package/axios) API

### Make a Get Request

```js
// Name: Get Example

import "@johnlindquist/kit"

let response = await get(
  "https://scriptkit.com/api/get-example"
)

await div(md(response.data.message))
```

[Open get-example in Script Kit](https://scriptkit.com/api/new?name=get-example&url=https://gist.githubusercontent.com/johnlindquist/cdef2447a1b49ad163a9c696369c930d/raw/65407970a7dd1af406b0cbee94e876e84822e16e/get-example.js")

### Make a Post Request

```js
// Name: Post Example

import "@johnlindquist/kit"

let response = await post(
  "https://scriptkit.com/api/post-example",
  {
    name: await arg("Enter your name"),
  }
)

await div(md(response.data.message))
```

[Open post-example in Script Kit](https://scriptkit.com/api/new?name=post-example&url=https://gist.githubusercontent.com/johnlindquist/8bac8a4e303fe21c93b93787c828419f/raw/fcb26d4eafa0fa36fcb88b02716e4503e130b375/post-example.js")

## Download Files

Use `download` to download a file from a url:

```js
// Name: Download a File

import "@johnlindquist/kit"

let url = "https://www.scriptkit.com/assets/logo.png"
let buffer = await download(url)

let fileName = path.basename(url)
let filePath = home(fileName)

await writeFile(filePath, buffer)
```

[Open download-a-file in Script Kit](https://scriptkit.com/api/new?name=download-a-file&url=https://gist.githubusercontent.com/johnlindquist/b10dbc2218d7c229fd4ed9865739b46f/raw/b9108056d761cdf6b1e8ec5c7d218d11f4002e56/download-a-file.js")

## Create a Text File

```js
// Name: Create a Text File

import "@johnlindquist/kit"

let filePath = await path() // Select a path that doesn't exist

let exists = await pathExists(filePath)

if (!exists) {
  await writeFile(filePath, "Hello world")
} else {
  await div(md(`${filePath} already exists...`))
}
```

[Open create-a-text-file in Script Kit](https://scriptkit.com/api/new?name=create-a-text-file&url=https://gist.githubusercontent.com/johnlindquist/24794c9b9bfce36ff898d34019555012/raw/c222c46aefd322ae50c9f5fc9e70ba0d2ef74d26/create-a-text-file.js")

## Live Edit a Text File

```js
// Name: Update a Text File

import "@johnlindquist/kit"

let filePath = home(`my-notes.md`)

// `ensureReadFile` will create the file with the content
// if it doesn't exist
let content = await ensureReadFile(filePath, "Hello world")

await editor({
  value: content,
  onInput: _.debounce(async input => {
    await writeFile(filePath, input)
  }, 200),
})
```

[Open update-a-text-file in Script Kit](https://scriptkit.com/api/new?name=update-a-text-file&url=https://gist.githubusercontent.com/johnlindquist/b9aa415d3870b8760c54ca57ccabd77d/raw/d3a4645c645dfb0d1749f1719aee817f723357fc/update-a-text-file.js")

## Display HTML

Use `await div('')` to display HTML.

```js
// Name: Display HTML

import "@johnlindquist/kit"

await div(`<h1>Hello World</h1>`)
```

[Open display-html in Script Kit](https://scriptkit.com/api/new?name=display-html&url=https://gist.githubusercontent.com/johnlindquist/ba1d6754436d898f8cebe8558647e720/raw/468e99941e8c63eff51ba24b6cb7c86bb9dd70fe/display-html.js")

## Display HTML with CSS

Script Kit bundles [Tailwind CSS](https://tailwindcss.com/).

```js
// Name: Display HTML with CSS

import "@johnlindquist/kit"

await div(
  `<h1 class="p-10 text-4xl text-center">Hello World</h1>`
)
```

[Open display-html-with-css in Script Kit](https://scriptkit.com/api/new?name=display-html-with-css&url=https://gist.githubusercontent.com/johnlindquist/02b7a43e5dd49f2e1508d8c110d12371/raw/1d80190f0cfce860078cec799fd614bd6f49a474/display-html-with-css.js")

## Display Markdown

The `md()` function will convert Markdown to HTML into HTML that you can pass into div. It will also add the default Tailwind styles so you won't have to think about formatting.

```js
// Name: Display Markdown

import "@johnlindquist/kit"

let html = md(`# Hello World`)

await div(html)
```

[Open display-markdown in Script Kit](https://scriptkit.com/api/new?name=display-markdown&url=https://gist.githubusercontent.com/johnlindquist/84779dbf8e39212c672b16ee72c68ccf/raw/7e985c988fa6aa878e4c0040dac6b87b8cfb173c/display-markdown.js")

## Run a Script on a Schedule

Use cron syntax to run scripts on a schedule. The following example will show a notification to stand up and stretch every 15 minutes.

```js
// Name: Stand Up and Stretch
// Schedule: */15 * * * *

import "@johnlindquist/kit"

notify(`Stand up and stretch`)
```

[Open stand-up-and-stretch in Script Kit](https://scriptkit.com/api/new?name=stand-up-and-stretch&url=https://gist.githubusercontent.com/johnlindquist/4a857741902927cc97e10db7a43b497d/raw/e01f61d697941fe0f0e90d51d5eb35f81b214be7/stand-up-and-stretch.ts")

[Crontab.guru](https://crontab.guru/) is a great utility to help generate and understand cron syntax.

## Environment Variables

The `env` helper will read environment variables from ~/.kenv/.env. If the variable doesn't exist, it will prompt you to create it.

```js
// Name: Env Example

import "@johnlindquist/kit"

let KEY = await env("MY_KEY")

await div(md(`You loaded ${KEY} from ~/.kenv/.env`))
```

[Open env-example in Script Kit](https://scriptkit.com/api/new?name=env-example&url=https://gist.githubusercontent.com/johnlindquist/84068b5eb52a366b0746aff3f984f3dd/raw/c22f3160535158d2d38952b4a7ee22a105d9359f/env-example.js")

## Environment Variable Async Prompt

If you pass a function as the second argument to `env`, it will only be called if the variable doesn't exist.
This allows you to set Enviroment Variables from a list, an API, or any other data source.

```js
// Name: Choose an Environment Variable

import "@johnlindquist/kit"

let MY_API_USER = await env("MY_API_USER", async () => {
  return await arg("Select a user for your API", [
    "John",
    "Mindy",
    "Joy",
  ])
})

await div(
  md(
    `You selected ${MY_API_USER}. Running this script again will remember your choice`
  )
)
```

[Open choose-an-environment-variable in Script Kit](https://scriptkit.com/api/new?name=choose-an-environment-variable&url=https://gist.githubusercontent.com/johnlindquist/cbc1029ea6abcdb8658cc3919b05875c/raw/cc8ca92d9edc57e16e4fcf2978e5560c6c73ab71/choose-an-environment-variable.js")

## Share as a Gist, Link, URL, or Markdown

The Script Kit main window also includes many other share options:

- Share as Gist <kbd>cmd+g</kbd>: Creates as Gist of the selected script, then copies the URL to the clipboard
- Share as Link <kbd>opt+s</kbd>: Creates a private installable kit://link to the selected script, then copies the URL to the clipboard. These links are very long as they encode the entire script into the URL.
- Share as URL <kbd>opt+u</kbd>: Creates a Gist of the selected script, then copies an installable public URL to the clipboard
- Share as Markdown <kbd>cmd+m</kbd>: Copies the selected script as a Markdown snippet to the clipboard

## Get Featured

Featured scripts are displayed in:

- The `Community` tab of the Script Kit main window
- On the [Community Scripts](https://www.scriptkit.com/scripts) page

To get featured, post your script to the [Script Kit Github discussions Share page](https://github.com/johnlindquist/kit/discussions/categories/share). With a script focused in the Script Kit main window, you can press right or <kbd>cmd+k</kbd> to bring up a share menu which will automatically walk you through creating a shareable post for the script.

As a shortcut, hit <kbd>cmd+s</kbd> with a script selected to automatically run the "Share as Discussion" process.

## Experiment with Data in Chrome DevTools

```js
// Name: Play with Data in Chrome DevTools

import "@johnlindquist/kit"

// Will open a standalone Chrome DevTools window
// The object passed in will be displayed
// You can access the object using `x`, e.g., `x.message` will be `Hello world`
dev({
  message: "Hello world",
})
```

[Open play-with-data-in-chrome-devtools in Script Kit](https://scriptkit.com/api/new?name=play-with-data-in-chrome-devtools&url=https://gist.githubusercontent.com/johnlindquist/3202a35d448efd09c37c4b49b7f7c95a/raw/187da03b4dae7c1ebe6fb79bd1ea47f7a492cb38/play-with-data-in-chrome-devtools.js")
