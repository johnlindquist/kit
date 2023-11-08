# API

## arg

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

The most common prompt for accepting user input.

### Details

1. The first argument is a string or a prompt configuration object.
2. The second argument is a list of choices, a string to render, or a function that returns choices or a string to render.

### arg Hello World

```js
let value = await arg()
```

### A Basic String Input

```js
let name = await arg("Enter your name")
```

### arg with Choices Array

```js
let name = await arg("Select a name", [
  "John",
  "Mindy",
  "Joy",
])
```

### arg with Async Choices

```js
let name = await arg("Select a name", async () => {
  let response = await get("https://swapi.dev/api/people/")
  return response?.data?.results.map(p => p.name)
})
```

### arg with Async Choices Object

```js
let person = await arg("Select a person", async () => {
  let response = await get("https://swapi.dev/api/people/")
  // return an array of objects with "name", "value", and "description" properties
  return response?.data?.results.map(person => {
    return {
      name: person.name,
      description: person.url,
      value: person,
    }
  })
})
```

### arg with Generated Choices

```js
let char = await arg("Type then pick a char", input => {
  // return an array of strings
  return input.split("")
})
```

### arg with Shortcuts

```js
let url = "https://swapi.dev/api/people"
let name = await arg(
  {
    placeholder: "Select a name",
    shortcuts: [
      {
        name: "Explore API",
        key: "cmd+e",
        onPress: async () => {
          open(url)
        },
        bar: "right",
      },
    ],
  },
  async () => {
    let response = await get(url)
    return response?.data?.results.map(p => p.name)
  }
)
```

## div

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

`div` displays HTML. Pass a string of HTML to `div` to render it. `div` is commonly used in conjunction with `md` to render markdown.

### Details

1. Just like arg, the first argument is a string or a prompt configuration object.
2. Optional:The second argument is a string of tailwind class to apply to the container, e.g., `bg-white p-4`.

### div Hello World

```js
await div(`Hello world!`)
```

### div with Markdown

```js
await div(
  md(`
# Hello world!

## Thanks for coming to my demo
* This is a list
* This is another item
* This is the last item

`)
)
```

### div with Tailwind Classes

```js
await div(
  `Hello world!`,
  `bg-white text-black text-4xl p-4`
)
```

### div with Submit Links

```js
let name = await div(
  md(`# Pick a Name
* [John](submit:John)
* [Mindy](submit:Mindy)
* [Joy](submit:Joy)
`)
)

await div(md(`# You selected ${name}`))
```

## dev

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

`dev` Opens a standalone instance of Chrome Dev Tools so you can play with JavaScript in the console. Passing in an object will set the variable `x` to your object in the console making it easy to inspect.

### Details

1. Optional: the first argument is an object to set to the variable `x` to in the console.

### dev Hello World

```js
dev()
```

### dev with Object

```js
dev({
  name: "John",
  age: 40,
})
```

## editor

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

The `editor` function opens a text editor with the given text. The editor is a full-featured "Monaco" editor with syntax highlighting, find/replace, and more. The editor is a great way to edit or update text to write a file. The default language is markdown.

### editor Hello World

```js
let content = await editor()
```

### editor with Initial Content

```js
let content = await editor("Hello world!")
```

### Load Remote Text Content into Editor

```js
let response = await get(
  `https://raw.githubusercontent.com/johnlindquist/kit/main/API.md`
)

let content = await editor(response.data)
```

## term

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

The `term` function opens a terminal window. The terminal is a full-featured terminal, but only intended for running commands and CLI tools that require user input. `term` is not suitable for long-running processes (try `exec` instead).

### Details

1. Optional: the first argument is a command to run with the terminal

### term Hello World

```js
await term()
```

### term with Command

```js
await term(`cd ~/.kenv/scripts && ls`)
```

## template

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

The `template` prompt will present the editor populated by your template. You can then tab through each variable in your template and edit it.

### Details

1. The first argument is a string template. Add variables using $1, $2, etc. You can also use \${1:default value} to set a default value.

### Template Hello World

```js
let text = await template(`Hello $1!`)
```

### Standard Usage

```js
let text = await template(`
Dear \${1:name},

Please meet me at \${2:address}

    Sincerely, John`)
```

## hotkey

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

The `hotkey` prompt allows you to press modifier keys, then submits once you've pressed a non-monodifier key. For example, press `command` then `e` to submit key info about the `command` and `e` keys:

```json
{
  "key": "e",
  "command": true,
  "shift": false,
  "option": false,
  "control": false,
  "fn": false,
  "hyper": false,
  "os": false,
  "super": false,
  "win": false,
  "shortcut": "command e",
  "keyCode": "KeyE"
}
```

This can be useful when you want to use a palette of commands and trigger each of them by switching on a hotkey.

### Details

1. Optional: The first argument is a string to display in the prompt.

### hotkey Hello World

```js
let keyInfo = await hotkey()
await editor(JSON.stringify(keyInfo, null, 2))
```

## drop

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

Use `await drop()` to prompt the user to drop a file or folder.

### drop Hello World

```js
// Note: Dropping one or more files returns an array of file information
// Dropping text or an image from the browser returns a string
let fileInfos = await drop()

let filePaths = fileInfos.map(f => f.path).join(",")

await div(md(filePaths))
```

## fields

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

The `fields` prompt allows you to rapidly create a form with fields.

### Details

1. An array of labels or objects with label and field properties.

### fields Hello World

```js
let [first, last] = await fields([
  "First name",
  "Last name",
])
```

### fields with Field Properties

```js
let [name, age] = await fields([
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "John",
  },
  {
    name: "age",
    label: "Age",
    type: "number",
    placeholder: "40",
  },
])
```

## selectFile

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

Prompt the user to select a file using the Finder dialog:

```js
let filePath = await selectFile()
```

## selectFolder

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

Prompt the user to select a folder using the Finder dialog:

```js
let folderPath = await selectFolder()
```

## widget

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

A `widget` creates a new window using HTML. The HTML can be styled via [Tailwind CSS](https://tailwindcss.com/docs/utility-first) class names.
Templating and interactivity can be added via [petite-vue](https://github.com/vuejs/petite-vue).

### Details

1. The first argument is a string of HTML to render in the window.
2. Optional: the second argument is ["Browser Window Options"](https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions)

### widget Hello World

```js
await widget(`<h1 class="p-4 text-4xl">Hello World!</h1>`)
```

### widget Clock

```js
let clock = await widget(
  `<h1 class="text-7xl p-5 whitespace-nowrap">{{date}}</h1>`,
  {
    transparent: true,
    draggable: true,
    hasShadow: false,
    alwaysOnTop: true,
  }
)

setInterval(() => {
  clock.setState({
    date: new Date().toLocaleTimeString(),
  })
}, 1000)
```

### widget Events

```js
let text = ""
let count = 0

let w = await widget(`
<div class="p-5">
    <h1>Widget Events</h1>
    <input autofocus type="text" class="border dark:bg-black"/>
    <button id="myButton" class="border px-2 py-1">+</button>
    <span>{{count}}</span>    
</div>
`)

w.onClick(event => {
  if (event.targetId === "myButton") {
    w.setState({ count: count++ })
  }
})

w.onClose(async () => {
  await widget(`
<div class="p-5">
    <h1>You closed the other widget</h1>
    <p>${text}</p>
</div>
`)
})

w.onInput(event => {
  text = event.value
})

w.onMoved(({ x, y }) => {
  // e.g., save position
})

w.onResized(({ width, height }) => {
  // e.g., save size
})
```

## path

The `path` prompt allows you to select a file or folder from the file system. You navigate with tab/shift+tab (or right/left arrows) and enter to select.

### Details

1. Optional: The first argument is the initial directory to open with. Defaults to the home directory.

### path Hello World

```js
let selectedFile = await path()
```

## select

Script Kit now contains a `select` prompt that lets you choose from a list of options.

### Details

1. The first argument is a array or a prompt configuration object.
2. The second argument is a list of choices, a array to render, or a function that returns choices or a string to render.

### select Basic Array Input

```js
let multipleChoice = await select(
  "Select one or more developer",
  ["John", "Nghia", "Mindy", "Joy"]
)
```

### select Array Object

```js
const people = [
  {
    name: "John",
    description: "Full-stack Dev",
    value: "John",
  },
  {
    name: "Nghia",
    description: "Full-stackoverflow dev",
    value: "Nghia",
  },
  {
    name: "Mindy",
    description: "Business Analyst",
    value: "Mindy",
  },
  {
    name: "Joy",
    description: "Leader",
    value: "Joy",
  },
]
let multipleChoice = await select(
  "Select one or more developer",
  people
)
```

### select Async Choices Array Object

```js
let name = await select(
  "GET: NAME (please wait)",
  async () => {
    let response = await get(
      "https://swapi.dev/api/people/"
    )
    return response?.data?.results.map(person => {
      return {
        name: person.name,
        description: `height: ${person.height}, mass: ${person.mass}`,
        value: person,
        preview: () => JSON.stringify(person),
      }
    })
  }
)
```

### select Generated Input Choices

```js
let word = await select("Type then pick a words", input => {
  return input.trim().split(new RegExp("[.,;/-_\n]", "g"))
})
```

## Missing Something?

<!-- enter: Update Docs -->
<!-- value: download-md.js -->

These API docs are definitely incomplete and constantly evolving. If you're missing something, [suggest an edit](https://github.com/johnlindquist/kit/blob/main/API.md) to the docs or open an issue on GitHub.

Press <kbd>Enter</kbd> to download the latest docs.
