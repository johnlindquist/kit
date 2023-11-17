# Script Kit Guide


## Run

### Running Scripts

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

Press `cmd+;` (or `ctrl+;` on Windows) to open the Script Kit prompt. Search for the script you want to run and press `enter` to run it.

You can also open the prompt from the menu bar and select "Open Prompt."

## Debug

### Debugging Scripts

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

With the prompt open, run a script with `cmd+enter` (`ctrl+enter` on Windows) to launch the script in debug mode. An inspector will appear alongside the script, allowing you to inspect current values and step through it line by line. Use the `debugger` statement anywhere in your script to create a breakpoint where your script will pause. (When running the script normally, the `debugger` statement is simply ignored.)

```js
let response = await get("https://api.github.com/repos/johnlindquist/kit")

// The inspector will pause your script so you can examine the value of "response""
debugger
```

## Create

### Create a Script

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

Keep your scripts in `~/.kenv/scripts` ("kenv" stands for "Kit Environment").

With the Kit.app prompt open, start typing the name of the script you want to create, then hit `enter`` when prompted to create a script. Your editor will launch with the newly created script focused.

Kit.app continuously watches the `~/.kenv/scripts` directory for changes. Creating, deleting, or modifying scripts will be automatically reflected in the Kit.app prompt.

### Naming a Script

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

The file name of the script is lowercased and dashed like `hello-world.js` by convention. You can add an addionational `//Name: Hello World` to the top of your script for a more friendly name to appear when searching in the prompt. 

```js
//Name: Hello World
```

When creating a script with the prompt, you can type the `Friendly Name` of the script and Kit.app will automatically create the dashed file name for you.


### // Shortcut Metadata

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

Use the `// Shortcut` metadata to add a global keyboard shortcut to any script

```js
// Shortcut: cmd shift j

import "@johnlindquist/kit"

say(`You pressed command shift j`)
```

```js
// Shortcut: opt i

import "@johnlindquist/kit"

say(`You pressed option i`)
```

## Basics

### Input Text with `await arg()`

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

The simplest form of input you can accept from a user is an `arg()`

```js
// Name: Input Text

import "@johnlindquist/kit"

let name = await arg("Enter your name")

await div(md(`Hello, ${name}`))
```

### Select From a List of Strings

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

```js
// Name: Select From a List

import "@johnlindquist/kit"

let fruit = await arg("Pick a fruit", [
  "Apple",
  "Banana",
  "Cherry",
])

await div(md(`You selected ${fruit}`))
```

### Select From a List of Objects

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

```js
// Name: Select From a List of Objects

import "@johnlindquist/kit"

let { size, weight } = await arg("Select a Fruit", [
  {
    name: "Apple",
    description: "A shiny red fruit",
    // add any properties to "value"
    value: {
      size: "small",
      weight: 1,
    },
  },
  {
    name: "Banana",
    description: "A long yellow fruit",
    value: {
      size: "medium",
      weight: 2,
    },
  },
])

await div(
  md(
    `You selected a fruit with size: ${size} and weight: ${weight}`
  )
)
```

### Select from a Dynamic List

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

```js
// Name: Select From a Dynamic List

import "@johnlindquist/kit"

await arg("Select a Star Wars Character", async () => {
  // Get a list of people from the swapi api
  let response = await get("https://swapi.dev/api/people/")

  return response?.data?.results.map(p => p.name)
})
```



### Display a Preview When Focusing a Choice

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

```js
// Name: Display a Preview When Focusing a Choice

import "@johnlindquist/kit"

let heights = [320, 480, 640]
let choices = heights.map(h => {
  return {
    name: `Kitten height: ${h}`,
    preview: () =>
      `<img class="w-full" src="http://placekitten.com/640/${h}">`,
    value: h,
  }
})

let height = await arg("Select a Kitten", choices)

await div(md(`You selected ${height}`))
```

### Display HTML Beneath the Input

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

If the second argument to `arg()` is a string, it will be displayed beneath the input as HTML.

```js
// Just a string
await arg(
  "Select a fruit",
  md(`I recommend typing "Apple"`) // "md" converts strings to HTML
)
```

A function that returns a string will also be displayed beneath the input as HTML. You can use the `input` text in the function to create dynamic HTML.

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
// Dynamic choices, static preview
await arg(
  {
    preview: async () =>
      await highlight(`
## This is just information

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

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

### Display Only HTML

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

Use `await div('')` to display HTML.

```js
// Name: Display HTML

import "@johnlindquist/kit"

await div(`<h1>Hello World</h1>`)
```

### Style a Container

The second argument of `div` allows you to add [tailwind](https://tailwindcss.com/) classes to the container of your html. For example, `p-5` will add a `padding: 1.25rem;` to the container.

```js
await div(`<h1>Hi</h1>`, `p-5`)
```


### Display HTML with CSS

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

Script Kit bundles [Tailwind CSS](https://tailwindcss.com/).

```js
// Name: Display HTML with CSS

import "@johnlindquist/kit"

await div(
  `<h1 class="p-10 text-4xl text-center">Hello World</h1>`
)
```

### Display Markdown

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

The `md()` function will convert Markdown into HTML that you can pass into div. It will also add the default Tailwind styles so you won't have to think about formatting.

```js
// Name: Display Markdown

import "@johnlindquist/kit"

let html = md(`# Hello World`)

await div(html)
```

### Set Options using Flags

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

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

## Cache

### Store Simple JSON data with db

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

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

This db helper can also be used as a simple Key/value Store like this: 

```js
// Menu: Database Read/Write Example 2
// Description: Use 'db' helper as Key/Value Store

// Open the json file with the same name as the script file, the data in the param is the default, 
// which will be used when the db file is opened the first time
const scriptDB = await db({hello: 'World'});

// Note: This db read here should only make sure the db object has the latest content from disk. 
// It may be unnecessary directly after opening the db object. 
await scriptDB.read();

if (scriptDB.data.hello === 'World') {
    // change value in your db
    scriptDB.data.hello = 'Bob';
} else {
    // change value back in your db
    scriptDB.data.hello = 'World';
}

await scriptDB.write();

```


## Watch

### Watch Files to Trigger Scripts

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

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

## Command

## Run Shell Commands

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

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

## Requests

## Make HTTP Requests with get, put, post, and del

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

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



### Download Files

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

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

## Files

### Read a Text File

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

You can use `readFile` to read a text file from your system:

```js
// Name: Read a Text File

import "@johnlindquist/kit"

// Download a readme for the sake of the example
let fileUrl = `https://raw.githubusercontent.com/johnlindquist/kit/main/README.md`
let filePath = home("README.md")
let buffer = await download(fileUrl)
await writeFile(filePath, buffer)

// Read the file
let contents = await readFile(filePath, "utf-8")
await editor(contents)
```

### Create a Text File

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

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



### Live Edit a Text File

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

```js
// Name: Update a Text File

import "@johnlindquist/kit"

let filePath = home(`my-notes.md`)

// `ensureReadFile` will create the file with the content
// if it doesn't exist
let content = await ensureReadFile(filePath, "Hello world")

await editor({
  value: content,
  onInput: debounce(async input => {
    await writeFile(filePath, input)
  }, 200),
})
```

## Schedule

### Run a Script on a Schedule

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

Use cron syntax to run scripts on a schedule. The following example will show a notification to stand up and stretch every 15 minutes.

```js
// Name: Stand Up and Stretch
// Schedule: */15 * * * *

import "@johnlindquist/kit"

notify(`Stand up and stretch`)
```



[Crontab.guru](https://crontab.guru/) is a great utility to help generate and understand cron syntax.

## .env

### Environment Variables

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

The `env` helper will read environment variables from ~/.kenv/.env. If the variable doesn't exist, it will prompt you to create it.

```js
// Name: Env Example

import "@johnlindquist/kit"

let KEY = await env("MY_KEY")

await div(md(`You loaded ${KEY} from ~/.kenv/.env`))
```



### Environment Variable Async Prompt

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

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

## Share

### Share as a Gist, Link, URL, or Markdown

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

The Script Kit main window also includes many other share options:

- Share as Gist <kbd>cmd+g</kbd>: Creates as Gist of the selected script, then copies the URL to the clipboard
- Share as Link <kbd>opt+s</kbd>: Creates a private installable kit://link to the selected script, then copies the URL to the clipboard. These links are very long as they encode the entire script into the URL.
- Share as URL <kbd>opt+u</kbd>: Creates a Gist of the selected script, then copies an installable public URL to the clipboard
- Share as Markdown <kbd>cmd+m</kbd>: Copies the selected script as a Markdown snippet to the clipboard

## Community

### Get Featured

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

Featured scripts are displayed in:

- The `Community` tab of the Script Kit main window
- On the [Community Scripts](https://www.scriptkit.com/scripts) page

To get featured, post your script to the [Script Kit Github discussions Share page](https://github.com/johnlindquist/kit/discussions/categories/share). With a script focused in the Script Kit main window, you can press right or <kbd>cmd+k</kbd> to bring up a share menu which will automatically walk you through creating a shareable post for the script.

As a shortcut, hit <kbd>cmd+s</kbd> with a script selected to automatically run the "Share as Discussion" process.

## Inspect

### Experiment with Data in Chrome DevTools

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

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

## Metadata

### // Shortcode Metadata

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

A shortcode allows you quickly run a script without needing to search for it.

To trigger a `// Shortcode`, type the string of characters from the main menu, then hit `spacebar`. In this example, you would type `oi` then `spacebar` to run this script:

```js
// Shortcode: oi

import "@johnlindquist/kit"

say(`You pressed option i`)
```

## Tips

### Quick Submit from Hint

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

A common pattern from Terminal is to quickly submit a script from a hint. Using a bracket around a single character will submit that character when pressed.

```js
import "@johnlindquist/kit"

let value = await arg({
  placeholder: "Continue?",
  hint: `Another [y]/[n]`,
})

if (value === "y") {
  say(`You pressed y`)
} else {
  say(`You pressed n`)
}
```

### Quick Submit from Choice

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

If you need to provide a little more information to the user, use a choice instead of a hint. This allows you to provide a full value that will be submitted instead of just the single letter.

```js
import "@johnlindquist/kit"

let value = await arg("Select a food", [
  {
    name: "[a]pple",
    value: "apple",
  },
  {
    name: "[b]anana",
    value: "banana",
  },
  {
    name: "[c]heese",
    value: "cheese",
  },
])

await div(md(value))
```



### Run Scripts from Other Apps

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

Are you a fan of one of these amazing tools?
- [Keyboard Maestro](https://www.keyboardmaestro.com/main/)
- [Better Touch Tool](https://folivora.ai/)
- [Karabiner](https://karabiner-elements.pqrs.org/)
- [Raycast](https://www.raycast.com/)
- [Alfred](https://www.alfredapp.com/)

We love all these tools! So we made sure the scripts you create in Script Kit can be invoked by them too:

If you have a script named `center-app`, then you can paste the following snippet into the "scripts" section of any of these tools.

```bash
~/.kit/kar center-app
```

`kar` is an executable that takes the script name and sends it to Kit.app to run.

> It's named `kar` because we're HUGE fans of  [karabiner](https://karabiner-elements.pqrs.org/) and using "kit kar" as a transport
> for scripts into the app makes us giggle 😇

Any arguments you pass to the script will also be sent along. So if you want to run `center-app` with a padding of `50`:

```bash
~/.kit/kar center-app 50
```

## Path

### Select a Path

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

```js
// Name: Select a Path

import "@johnlindquist/kit"

let filePath = await path()

await div(md(`You selected ${filePath}`))
```

### Select a Path with Options

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

```js
// Name: Select a Path with Options

import "@johnlindquist/kit"

await path({
  hint: `Select a path containing JS files`,
  onlyDirs: true,
  onChoiceFocus: async (input, { focused }) => {
    let focusedPath = focused.value
    try {
      let files = await readdir(focusedPath)
      let hasJS = files.find(f => f.endsWith(".js"))

      setPreview(
        md(
          `${
            hasJS ? "✅ Found" : "🔴 Didn't find"
          } JS files`
        )
      )
    } catch (error) {
      log(error)
    }
  },
})
```


### Select from Finder Prompts

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

```js
// Name: Select from Finder Prompt

import "@johnlindquist/kit"

let filePath = await selectFile()

let folderPath = await selectFolder()

await div(md(`You selected ${filePath} and ${folderPath}`))
```

## Terminal

### Built-in Terminal

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

```js
// Name: Run Commands in the Terminal

import "@johnlindquist/kit"

await term({
  //defaults to home dir
  cwd: `~/.kenv/scripts`,
  command: `ls`,
})
```

> The shell defaults to `zsh`. You can change your shell by setting the `KIT_SHELL` environment variable in the ~/kenv/.env, but most of the testing has been done with `zsh`.



## Editor

### Built-in Editor

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

Script Kit ships with a built-in version of the Monaco editor. Use `await editor()` to switch to the editor prompt.

```js
// Name: Editor Example

import "@johnlindquist/kit"

let result = await editor()

await div(md(result))
```

### Load Text in the Editor

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

```js
// Name: Load Text Into the Editor

import "@johnlindquist/kit"

let { data } = await get(
  `https://raw.githubusercontent.com/johnlindquist/kit/main/README.md`
)

let result = await editor({
  value: data,
  // Supports "css", "js", "ts", "md", "properties". "md" is default. More language support coming in future releases.
  language: "md",
  footer: `Hit cmd+s to continue...`,
})

await div(md(result))
```

## Config

### Add ~/.kit/bin to $PATH

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

> This is similar to VS Code's "Add `code` to path"

You can run the `kit` CLI from your terminal with

```bash
~/.kit/bin/kit
```

but this option will allow you run the CLI with:

```bash
kit
```

> If you're familiar with adding to your `.zshrc`, just add `~/.kit/bin` to your PATH.

The `kit` CLI will allow you to run, edit, etc scripts from your terminal.

### Required Permissions for Features

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

Kit.app requires accessibility permission for the following reasons:
* Watch user input to trigger Snippets and Clipboard History
* Send keystrokes to trigger for `setSelectedText`, `getSelectedText`, `keyboard.type` and others
* In the future, recording Macros, mouse actions, and more

❗️ **You must quit Kit.app and re-open it for changes to take effect.** 

![osx preferences panel](https://user-images.githubusercontent.com/36073/174673600-59020e49-be04-4786-81f7-5bbe20a9ce6c.png)

## Submit

### Submit From Live Data

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

Some scenarios require `setInterval` or other "live data" utils. This means you can't use `await` on the arg/div/textarea/etc because `await` prevents the script from continuing on to start the `setInterval`.

![CleanShot 2021-11-28 at 08 58 04](https://user-images.githubusercontent.com/36073/143775792-34c1fb15-21b9-4690-b8e2-23e1447f65e5.gif)

Use the Promise `then` on arg/div/textarea/etc to allow the script to continue to run to the `setInterval`. Inside of the `then` callback, you will have to clear the interval for your script to continue/complete:

```js
let intervalId = 0
div(md(`Click a value`)).then(async value => {
  clearInterval(intervalId)

  await div(md(value))
})

intervalId = setInterval(() => {
  let value = Math.random()

  setPanel(
    md(`
  [${value}](submit:${value})
  `)
  )
}, 1000)
```


### Strict Mode

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

`strict` is enabled by default and it forces the user to pick an item from the list, preventing them from entering their own text.

When you disabled `strict`, if you type something that eliminates the entire list, then hit <kbd>Enter</kbd>, the string from the input will be passed back.

> Note: If the list values are Objects and the user inputs a String, you will need to handle either type being returned

```js
// If the list is completely filtered, hitting enter does nothing.
let fruit = await arg(`You can only pick one`, [
  `Apple`,
  `Banana`,
  `Orange`,
])

// If the list is completely filtered, hitting enter sends whatever
// is currently in the input.
let fruitOrInput = await arg(
  {
    placeholder: `Pick a fruit or type anything`,
    strict: false,
  },
  [`Apple`, `Banana`, `Orange`]
)

await textarea(`${fruit} and ${fruitOrInput}`)
```

## Tips

### Quick Keys

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

A quick key allows you to bind a single key to submit a prompt.

You can add quick keys inside the "hint" if you don't want to bother with choices:

```js
//Type "y" or "n"
let confirm = await arg({
  placeholder: "Eat a taco?",
  hint: `[y]es/[n]o`,
})

console.log(confirm) //"y" or "n"
```

Otherwise, add the quick keys in the `name` of the choices and it will return the quick key:

```js
 // Type "a", "b", or "g"
let fruit = await arg(`Pick one`, [
  `An [a]pple`,
  `A [b]anana`,
  `a [g]rape`,
])

console.log(fruit) //"a", "b", or "g"
```

You can add a value, then typing the quick key will return the value:

```js
// Type "c" or "a"
let vegetable = await arg("Pick a veggie", [
  { name: "[C]elery", value: "Celery" },
  { name: "C[a]rrot", value: "Carrot" },
])

console.log(vegetable) //"Celery" or "Carrot"
```


## Widget

### Create a Widget

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

Use the `widget` method to spawn a new, persisting window that is disconnected from the script.

```js
await widget(`
<div class="bg-black text-white h-screen p-5">
    Hello there!
<div>

`)
```

### Position a Widget on Screen

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

You can control the size/position of each `show` window you create, but you'll need some info from the current screen (especially with a multi-monitor setup!) to be able to position the window where you want it:

```js
let width = 480
let height = 320

let { workArea } = await getActiveScreen()
let { x, y, width: workAreaWidth } = workArea

await widget(
  md(`
# I'm in the top right of the current screen!

<div class="flex justify-center text-9xl">
😘
</div>
`),
  {
    width,
    height,
    x: x + workAreaWidth - width,
    y: y,
  }
)
```

## Advanced Prompt

### Update on Input

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

When you pass a function as the second argument of `arg`, you can take the current `input` and return a string. Kit.app will then render the results as HTML. The simplest example looks like this:

```js
await arg("Start typing", input => input)
```

If you want to make it look a bit nicer, you can wrap the output with some HTML:

```js
await arg(
  "Type something",
  input =>
    `<div class="text-3xl flex justify-center items-center p-5">
${input || `Waiting for input`}
</div>`
)
```

Growing on the example above, here's a Celsius to Fahrenheit converter:

```js
let cToF = celsius => {
  return (celsius * 9) / 5 + 32
}

await arg(
  "Enter degress in celsius",
  input =>
    `<div class="text-3xl flex justify-center items-center p-5">
${input ? cToF(input) + "f" : `Waiting for input`}
</div>`
)
```

## Git

### Clone Git Repos with degit

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

We're developers. We clone project templates from github. [degit](https://www.npmjs.com/package/degit) is available on the global scope for exactly this scenario.

```js
let projectName = await arg("Name your project")
let targetDir = home("projects", projectName)

await degit(`https://github.com/sveltejs/template`).clone(
  targetDir
)

edit(targetDir)
```

## Log

### View Logs

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

When you use `console.log()` in a script, it writes the log out to a relative directory.

For example:

`~/.kenv/scripts/my-script.js`

will write logs to:

`~/.kenv/logs/my-script.log`

You can view the live output of a log in your terminal with:

```sh
tail -f ~/.kenv/logs/my-script.log
```

If you want to watch the main log, you can use:

```sh
tail -f ~/.kit/logs/kit.log
```

### Save webpage as a PDF

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

You can save any webpage as a PDF.

```js
// Name: Save news as PDF

import "@johnlindquist/kit"

const pdfResults = await getWebpageAsPdf('https://legiblenews.com');

await writeFile(home('news.pdf'), pdfResults);
```

### Take screenshot of webpage

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

You can take a screenshot of any webpage.

```js
// Name: Take screenshot of news webpage

import "@johnlindquist/kit"

const screenshotResults = await getScreenshotFromWebpage('https://legiblenews.com', {
  screenshotOptions: { fullPage: true },
});

await writeFile(home('news.png'), screenshotResults);
```

### Scrape content from a webpage

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

You can scrape content from a webpage. The first time you run this, you will be prompted to install Playwright.

```js
// Name: Scrape John's pinned Github repositories

import "@johnlindquist/kit"

const items = await scrapeSelector(
  'https://github.com/johnlindquist',
  // CSS Selector to target elements
  '.pinned-item-list-item-content > div > a',
  // [Optional] function to transform the elements, if omitted then `element.innerText` is returned
  (element) => ({
    title: element.innerText,
    link: element.href,
  }),
  // [Optional] options
  {
    headless: false,
    timeout: 60000,
  }
);

let filePath = home(`pinned-repos.md`)

// `ensureReadFile` will create the file with the content
// if it doesn't exist
let content = await ensureReadFile(filePath, items.map(({title, link}) => `- [${title}](${link})`).join('\n'))
```

## Contribute

## Missing Something?

<!-- value: https://github.com/johnlindquist/kit/blob/main/GUIDE.md -->

<!-- enter: Update Docs -->
<!-- value: download-md.js -->

This Guide constantly evolving. If you're missing something, [suggest an edit](https://github.com/johnlindquist/kit/blob/main/GUIDE.md) to the docs or open an issue on GitHub.

Hit <kbd>Enter</kbd> to download the latest docs.

