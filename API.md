# API

## Intro

### Welcome to Script Kit! 👋

Script Kit provides an opinionated set of global APIs meant to streamline the process of writing scripts. Many of them (such as prompts) are meant to interact with the app, but there are also many common APIs for working with files, etc, that are simply built-in node or third-party libraries exposed as globals.

_You do not need to use any of these APIs._ You are free to write your scripts and add whatever npm packages you like.

Also, you can import `kit` and access the APIs like so:

```js
import kit from "@johnlindquist/kit"

await kit.arg("Enter your name")
```

If you have questions, please reach out on our [Script Kit GitHub Discussions](https://github.com/johnlindquist/kit/discussions)

Happy Scripting! ❤️ - John Lindquist

### Playground

Press `cmd+p` while browsing an API to generate a script where you can experiment with examples contained in that section. Go ahead and try it now to experiment with the example below:

```js
await arg("Welcome to the playground!")
```

## Prompts

### arg



- Accept text input from the user.
- Optionally provide a list of choices filtered by the text input.
- Optionally provide a list of actions to trigger when the user presses a shortcut.


#### Details

1. The first argument is a string or a prompt configuration object.
2. The second argument is a list of choices, a string to render, or a function that returns choices or a string to render.

#### arg Hello World

```js
let value = await arg()
```

#### A Basic String Input

```js
let name = await arg("Enter your name")
```

#### arg with Choices Array

```js
let name = await arg("Select a name", [
  "John",
  "Mindy",
  "Joy",
])
```

#### arg with Async Choices

```js
let name = await arg("Select a name", async () => {
    let response = await get("https://swapi.dev/api/people/");
    return response?.data?.results.map((p) => p.name);
})
```

#### arg with Async Choices Object

```js
let person = await arg("Select a person", async () => {
    let response = await get("https://swapi.dev/api/people/");
    // return an array of objects with "name", "value", and "description" properties
    return response?.data?.results.map((person) => { 
        return {
            name: person.name,
            description: person.url,
            value: person
        }
    });
})
```

#### arg with Generated Choices

```js
let char = await arg("Type then pick a char", (input) => { 
    // return an array of strings
    return input.split("")
})
```

#### arg with Shortcuts

```js
let url = "https://swapi.dev/api/people"
let name = await arg({
    placeholder: "Select a name",
    shortcuts: [
        {
            name: "Explore API",
            key: "cmd+e",
            onPress: async () => { 
                open(url)
            },
            bar: "right"
        }
    ]
}, async () => { 
    let response = await get(url);
    return response?.data?.results.map((p) => p.name);
})
```

### micro

Same API as `arg`, but with a tiny, adorable UI.

### env

Load an env var if it exists, prompt to set the env var if not:

```js
// Write write "MY_ENV_VAR" to ~/.kenv/.env
let MY_ENV_VAR = await env("MY_ENV_VAR")
```

You can also prompt the user to set the env var using a prompt by nesting it in an async function:

```js
// Prompt the user to select from a path
let OUTPUT_DIR = await env("OUTPUT_DIR", async () => {
  return await path({
    hint: `Select the output directory`,
  })
})
```

### editor



The `editor` function opens a text editor with the given text. The editor is a full-featured "Monaco" editor with syntax highlighting, find/replace, and more. The editor is a great way to edit or update text to write a file. The default language is markdown.


#### editor Hello World

```js
let content = await editor()
```

#### editor with Initial Content

```js
let content = await editor("Hello world!")
```

#### Load Remote Text Content into Editor

```js
let response = await get(`https://raw.githubusercontent.com/johnlindquist/kit/main/API.md`)

let content = await editor(response.data)
```

### div




`div` displays HTML. Pass a string of HTML to `div` to render it. `div` is commonly used in conjunction with `md` to render markdown.

#### Details

1. Just like arg, the first argument is a string or a prompt configuration object.
2. Optional:The second argument is a string of tailwind class to apply to the container, e.g., `bg-white p-4`.


#### div Hello World

```js
await div(`Hello world!`)
```

#### div with Markdown

```js
await div(md(`
# Hello world!

### Thanks for coming to my demo
* This is a list
* This is another item
* This is the last item

`))
```

#### div with Tailwind Classes

```js
await div(`Hello world!`, `bg-white text-black text-4xl p-4`)
```

#### div with Submit Links

```js
let name = await div(md(`# Pick a Name
* [John](submit:John)
* [Mindy](submit:Mindy)
* [Joy](submit:Joy)
`))

await div(md(`# You selected ${name}`))
```

### term



The `term` function opens a terminal window. The terminal is a full-featured terminal, but only intended for running commands and CLI tools that require user input. `term` is not suitable for long-running processes (try `exec` instead).

#### Details

1. Optional: the first argument is a command to run with the terminal

#### term Hello World

```js
await term()
```

#### term with Command

```js
await term(`cd ~/.kenv/scripts && ls`)
```

### template



The `template` prompt will present the editor populated by your template. You can then tab through each variable in your template and edit it. 

#### Details

1. The first argument is a string template. Add variables using $1, $2, etc. You can also use \${1:default value} to set a default value.

#### Template Hello World

```js
let text = await template(`Hello $1!`)
```

#### Standard Usage

```js
let text = await template(`
Dear \${1:name},

Please meet me at \${2:address}

    Sincerely, John`)
```

### hotkey



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

#### Details

1. Optional: The first argument is a string to display in the prompt.


#### hotkey Hello World

```js
let keyInfo = await hotkey()
await editor(JSON.stringify(keyInfo, null, 2))
```

### drop



Use `await drop()` to prompt the user to drop a file or folder.

#### drop Hello World

```js
// Note: Dropping one or more files returns an array of file information
// Dropping text or an image from the browser returns a string
let fileInfos = await drop()

let filePaths = fileInfos.map(f => f.path).join(",")

await div(md(filePaths))
```



### fields



The `fields` prompt allows you to rapidly create a form with fields. 

#### Details

1. An array of labels or objects with label and field properties.

#### fields Hello World

```js
let [first, last] = await fields(["First name", "Last name"])
```


#### fields with Field Properties

```js
let [name, age] = await fields([
    {
        name: "name",
        label: "Name",
        type: "text",
        placeholder: "John"
    },
    {
        name: "age",
        label: "Age",
        type: "number",
        placeholder: "40"
    }
])
```


### form

Use an HTML form which returns an Object based on the names of the form fields.

```js
let result = await form(`
<div class="p-4">
    <input type="text" name="textInput" placeholder="Text Input" />
    <input type="password" name="passwordInput" placeholder="Password" />
    <input type="email" name="emailInput" placeholder="Email" />
    <input type="number" name="numberInput" placeholder="Number" />
    <input type="date" name="dateInput" placeholder="Date" />
    <input type="time" name="timeInput" placeholder="Time" />
    <input type="datetime-local" name="dateTimeInput" placeholder="Date and Time" />
    <input type="month" name="monthInput" placeholder="Month" />
    <input type="week" name="weekInput" placeholder="Week" />
    <input type="url" name="urlInput" placeholder="URL" />
    <input type="search" name="searchInput" placeholder="Search" />
    <input type="tel" name="telInput" placeholder="Telephone" />
    <input type="color" name="colorInput" placeholder="Color" />
    <textarea name="textareaInput" placeholder="Textarea"></textarea>
</div>
`)

inspect(result)
```

### chat

A chat prompt. Use `chat.addMessage()` to insert messages into the chat.

> Note: Manually invoke `submit` inside of a shortcut/action/etc to end the chat.

```js
// Name: Testing Chat

import "@johnlindquist/kit"

await chat({
  onInit: async () => {
    chat.addMessage({
      // Note: text and position are implemented, there are other properties that are a WIP
      text: "You like Script Kit",
      position: "left",
    })

    await wait(1000)

    chat.addMessage({
      text: "Yeah! It's awesome!",
      position: "right",
    })

    await wait(1000)

    chat.addMessage({
      text: "I know, right?!?",
      position: "left",
    })

    await wait(1000)

    chat.addMessage({
      text: `<img src="https://media0.giphy.com/media/yeE6B8nEKcTMWWvBzD/giphy.gif?cid=0b9ef2f49arnbs4aajuycirjsclpbtimvib6a76g7afizgr5&ep=v1_gifs_search&rid=giphy.gif" width="200px" />`,
      position: "right",
    })
  },
})

```

Also see the included "chatgpt" example for a much more advanced scenario.

### selectFile



Prompt the user to select a file using the Finder dialog:

```js
let filePath = await selectFile()
```

### selectFolder



Prompt the user to select a folder using the Finder dialog:

```js
let folderPath = await selectFolder()
```


### path

The `path` prompt allows you to select a file or folder from the file system. You navigate with tab/shift+tab (or right/left arrows) and enter to select.

#### Details

1. Optional: The first argument is the initial directory to open with. Defaults to the home directory.


#### path Hello World

```js
let selectedFile = await path()
```

### select

`select` lets you choose from a list of options.

#### Details

1. The first argument is a array or a prompt configuration object.
2. The second argument is a list of choices, a array to render, or a function that returns choices or a string to render.

#### select Basic Array Input

```js
let multipleChoice = await select(
  "Select one or more developer",
  ["John", "Nghia", "Mindy", "Joy"]
)
```

#### select Array Object

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

#### select Async Choices Array Object

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

#### select Generated Input Choices

```js
let word = await select("Type then pick a words", input => {
  return input.trim().split(new RegExp("[.,;/-_\n]", "g"))
})
```

### inpect



`inspect` takes an object and writes out a text file you can use to read/copy/paste the values from:

```js
let response = await get("https://swapi.dev/api/people/1/")
await inspect(response.data)
```

> Note: It will automatically convert objects to JSON to display them in the file


### dev



`dev` Opens a standalone instance of Chrome Dev Tools so you can play with JavaScript in the console. Passing in an object will set the variable `x` to your object in the console making it easy to inspect.

#### Details

1. Optional: the first argument is an object to set to the variable `x` to in the console.

#### dev Hello World

```js
dev()
```

#### dev with Object

```js
dev({
    name: "John",
    age: 40
})
```


### find

A file search prompt

```js
let filePath = await find("Search in the Downloads directory", {
  onlyin: home("Downloads"),
})

await revealFile(filePath)
```

### webcam

Prompt for webcam access. Press enter to capture an image buffer:

```js
let buffer = await webcam()
let imagePath = tmpPath("image.jpg")
await writeFile(imagePath, buffer)
await revealFile(imagePath)
```

## Alerts

### beep

Beep the system speaker:

```js
await beep()
```

### say

Say something using the built-in text-to-speech:

```js
await say("Done!")
```

### setStatus

Set the system menu bar icon and message. 
Each status message will be appended to a list. 
Clicking on the menu will display the list of messages. 
The status and messages will be dismissed once the tray closes, so use `log` if you want to persist messages.

```js
await setStatus({
  message: "Working on it...",
  status: "busy",
})
```

### menu

Set the system menu to a custom message/emoji with a list of scripts to run.

```js
await menu(`👍`, ["my-script", "another-script"])
```

Reset the menu to the default icon and scripts by passing an empty string

```js
await menu(``)
```

### notify

Send a system notification

```js
await notify("Attention!")
```

> Note: osx notifications require permissions for "Terminal Notifier" in the system preferences. Due to the complicated nature of configuring notifications, please use a search engine to find the latest instructions for your osx version.
> In the Script Kit menu bar icon: "Permissions -> Request Notification Permissions" might help.


## Widget

### widget

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
let clock = await widget(`<h1 class="text-7xl p-5 whitespace-nowrap">{{date}}</h1>`, {
    transparent: true,
    draggable: true,
    hasShadow: false,
    alwaysOnTop: true,
})

setInterval(()=> {
    clock.setState({
        date: new Date().toLocaleTimeString()
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

w.onClick((event) => {
    if (event.targetId === "myButton") {
        w.setState({count: count++})
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

w.onInput((event) => {
    text = event.value
})

w.onMoved(({ x, y}) => {
    // e.g., save position
})

w.onResized(({ width, height }) => {
    // e.g., save size
})
```

## Commands

### exec


`exec` uses allows you to run shell commands within your script:
> Note: Execa is an alias for `execaCommand` from the `execa` npm package with "shell" and "all" true by default.

```js

let result = await exec(`ls -la`, {
  cwd: home(), // where to run the command
  shell: "/bin/zsh", // if you're expecting to use specific shell features/configs
  all: true, // pipe both stdout and stderr to "all"
})

inspect(result.all)
```

### Displaying an Info Screen

It's extremely common to show the user what's happening while your command is running. This is often done by using `div` with `onInit` + `sumbit`:

```js
let result = await div({
  html: md(`# Loading your home directory`),
  onInit: async () => {
    let result = await exec(`sleep 2 && ls -la`, {
      cwd: home(), // where to run the command
      shell: "/bin/zsh", // use if you're expecting the command to load in your .zshrc
      all: true, // pipe both stdout and stderr to "all"
    })

    submit(result.all)
  },
})

inspect(result)
```

The `exec` function returns the stdout of the command if the command was successful. It throws an error if the command fails.

## Helpers

### path
PathSelector

### edit
Edit

### browse
Browse


### kenvPath

Generates a path to a file within your main kenv:

```js
let myScript = kenvPath("scripts", "my-script.ts") // ~/.kenv/scripts/my-script.ts
```

### kitPath

Generates a path to a file within the Kit SDK:

```js
let apiPath = kitPath("API.md") // ~/.kit/API.md
```

### knodePath

Generates a path to a file within knode:

```js
let readme = knodePath("README.md") // ~/.knode/readme.md
```

### tmpPath

Generates a path to a tmp directory based on the current script name:

```js
// Run from the "my-script.ts" script
let tmpAsset = await tmpPath("result.txt")
// ~/.kenv/tmp/my-script/result.txt
```

### npm

Deprecated: Use standard `import` syntax instead and you will automatically be prompted to install missing packages.

### run

Run a script based on the script name.

> Note: This is technically dynamically importing an ESM module and resolving the path under the hood

```js
// Run "my-script.ts" from another script
await run("my-script")
```

### select
Select

### basePrompt
Arg


### onTab
OnTab

### onExit
OnExit

### args
Args

### updateArgs
UpdateArgs

### argOpts
string[]

### wait
Wait

### home
PathFn

### isFile
IsCheck

### isDir
IsCheck

### isBin
IsCheck

### createPathResolver
PathResolver

### inspect
Inspect

### db
DB


### getScripts

Get all scripts as choices:

```js
let scripts = await getScripts()
let script = await arg("select a script", scripts)
inspect(script.filePath)
```


### selectScript

Open the main script select prompt with grouped scripts:

```js
let script = await selectScript()
inspect(script.filePath)
```



### selectKenv

Prompts to select a kenv. If you only have a "main" kenv, it will immediately return that kenv.

```js
let kenv = await selectKenv()
inspect(kenv)
```

### blur

Blur the prompt so you can type in the window behind the prompt. If you don't use "ignoreBlur", this will exit the prompt and script. You're probably looking for an example like below:

```js
await div({
  headerClassName: `hidden`,
  footerClassName: `hidden`,
  className: `p-4 justify-center items-center flex flex-col`,
  html: `<h1>Return focus to the app beneath this prompt</h1>

<p>Press the main shortcut to re-focus the prompt.</p>
<p>Make sure to use a "wait" to give system focusing a chance to work.</p>
  
  `,
  alwaysOnTop: true,
  ignoreBlur: true,
  onInit: async () => {
    await wait(500)
    await blur()
  },
})
```

### highlight

A code highlighter for markdown:

```js
let html = await highlight(`
# Hello World

~~~js
console.log("hello world")
~~~
`)

await div(html)
```

### terminal

(Mac only)

Launches the mac terminal using the specified command:

```js
terminal(`cd ~/.kit && ls -la`)
```

### projectPath

The resolver function for the parent directory of the `scripts` folder. Useful when launching scripts outside of your kenv, such as using Kit in the terminal with other projects. 

```js
let app = projectPath("src", "app.ts")
```

### clearAllTimeouts

Manually remove every timeout created by `setTimeout`

### clearAllIntervals

Manually remove every interval created by `setInterval`

### createGist

Create a gist from a string.

```js
let gist = await createGist(`Testing gist`)
open(gist.html_url)
```

### setShortcuts

The legacy approach to settings shortcuts. You're probably looking for `setActions`.

```js
await arg({
  onInit: async () => {
    setShortcuts([
      {
        name: "Testing Set Shortcuts",
        key: `${cmd}+3`,
        bar: "right",
        visible: true,
        onPress: () => {
          inspect("Just use actions instead of shortcuts :)")
        },
      },
    ])
  },
})
```

### isWin/isMac/isLinux

Booleans to help you determine the platform you're on.

### cmd

A global variable that is "cmd" on mac and "ctrl" on windows and linux to help make shortcuts cross-platform.

```js
let shortcut = `${cmd}+0`
```

### formatDate

```js
let today = formatDate(new Date(), "yyyy-MM-dd")
inspect(today) // "2023-11-12"
```

### formatDateToNow

```js
let nye = new Date("2023-12-31")
let until = formatDateToNow(nye)
inspect(until) // "about 2 months"
```

### createChoiceSearch
(choices: Choice[], config: Partial<Options & ConfigOptions>) => Promise<(query: string) => ScoredChoice[]>


### groupChoices

If you want to divide your choices into groups, add a group key to each choice, then run `groupChoices` on the choices:

```js
let choices = [{name: "banana", group: "fruit"}, {name: "apple", group: "fruit"}, {name: "carrot", group: "vegetable"}]
let groupedChoices = groupChoices(choices)
let snack = await arg("Select a snack", groupedChoices)
```

```ts
(choices: Choice[], options?: {
  groupKey?: string
  missingGroupName?: string
  order?: string[]
  sortChoicesKey?: string[]
  recentKey?: string
  recentLimit?: number
  excludeGroups?: string[]
}) => Choice[]
```

### preload
(scriptPath?: string) => void

An internal function used to preload the choices for the next script. This is only useful in scenarios where you're ok with showing "stale" data while waiting for the first prompt in the next script to load it's real data from somewhere else.

### finishScript

An internal function that marks the script as "done" and ready for cleanup by the app.

### formatChoices
(choices: Choice[], className?: string) => Choice[]

### setScoredChoices
(scoredChoices: ScoredChoice[]) => Promise<void>

### setSelectedChoices

Select the last two choices:
```js

let choices: Choice[] = ["1", "2", "3"].map(c => ({
  id: uuid(),
  name: c,
  value: c,
}))

await select(
  {
    onInit: async () => {
      setSelectedChoices(choices.slice(-2))
    },
  },
  choices
)
```

## Setters

### Caution - Internals

The following "set" functions are used internally by Kit. You will only need them in advanced cases that usually involving dynmically manipulating the current prompt.

### setEnter

Set the current name of the "Enter" button. You're probably looking for the "enter" property on the prompt or choice configuration object.

```js
// Prompt Config
await arg({
  enter: "Create File",
})

// Choice Config
await arg("Select a file", [
  {
    name: "Create File",
    enter: "Create File",
  },
])
```

### setFocused

Set the current focused choice. You're probably looking for the "focused" of "focusedId" property on the prompt or choice configuration object.

```js
await arg({
  focused: "banana", // Searches for the choice by "value", then falls back to "name"
}, ["banana"])


let choices = [{name: "a", id: "0"}, {name: "b", id: "1"}]
await arg({
  focusedId: "1"
}, ["banana"])
```

### setPlaceholder

Set the current placeholder. You're probably looking for the "placeholder" property on the prompt or choice configuration object.

```js
await arg({
  placeholder: "Type to search",
})
```

### setPanel

Set the current panel (the area beneath the arg input when displaying HTML instead of choices). You're probably looking to pass a string as the second argument to `arg` instead.

```js
await arg("This is the input", `This is a panel. Use HTML here`)
```

### setDiv

Set the content of the current `div` prompt. You're probably looking to pass a string as the first argument to `div` instead.

```js
await div(`This is a div`)
```

### setAlwaysOnTop

Set the current window to always be on top of other windows on the system. You're probably looking for the "alwaysOnTop" property on the prompt configuration object.

```js
await arg({
  alwaysOnTop: true,
})
```

### setPreview

Update the right preview panel with HTML.

### setPrompt

Mainly for internals. A raw setter for the current prompt. Expect issues, especially with state, if used without care.

### setBounds

Update the bounds of the current prompt. You're probably looking for the width/height/x/y property on the prompt configuration object.

> Note: Automatic prompt resizing is complicated and may interfere with your manual resizing. We're working on improving these APIs, but there are a lot of edge cases.

```js
await div({
  html: `Hello world`,
  width: 500,
  height: 500,
  x: 0,
  y: 0,
})
```

### setHint

Set the current hint. You're probably looking for the "hint" property on the prompt configuration object.

```js
await arg({
  placeholder: "Eat a donut?",
  hint: `[y]es/[n]o`
})
```

### setInput

Set the current input. You're probably looking for the "input" property on the prompt configuration object.

```js
await arg({
  input: "Hello world",
})
```

## Global Input

### onClick

Register a handler to receive a click event from the [uiohook-napi](https://www.npmjs.com/package/uiohook-napi) library:

```js
onClick(event => {
  // Do something with the event
})
```

```ts
interface UiohookMouseEvent {
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  x: number
  y: number
  button: unknown
  clicks: number
}
```

### onMousedown

```js
onMousedown(event => {
  // Do something with the event
})
```

Register a handler to receive a mousedown event from the [uiohook-napi](https://www.npmjs.com/package/uiohook-napi) library:

```ts
interface UiohookMouseEvent {
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  x: number
  y: number
  button: unknown
  clicks: number
}
```

### onMouseup

```js
onMouseup(event => {
  // Do something with the event
})
```

Register a handler to receive a mouseup event from the [uiohook-napi](https://www.npmjs.com/package/uiohook-napi) library:

```ts
interface UiohookMouseEvent {
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  x: number
  y: number
  button: unknown
  clicks: number
}
```

### onWheel

Register a handler to receive a wheel event from the [uiohook-napi](https://www.npmjs.com/package/uiohook-napi) library:


```js
onWheel(event => {
  // Do something with the event
})
```

```ts
interface UiohookWheelEvent {
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  x: number
  y: number
  clicks: number
  amount: number
  direction: WheelDirection
  rotation: number
}
```

### onKeydown

Register a handler to receive a keydown event from the [uiohook-napi](https://www.npmjs.com/package/uiohook-napi) library:


```js
onKeydown(event => {
  // Do something with the event
})
```

```ts
interface UiohookKeyboardEvent {
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  keycode: number
}
```

### onKeyup

Register a handler to receive a keyup event from the [uiohook-napi](https://www.npmjs.com/package/uiohook-napi) library:


```js
onKeyup(event => {
  // Do something with the event
})
```

```ts
interface UiohookKeyboardEvent {
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  keycode: number
}
```


## App Utils

### hide

Hide the prompt when you're script doesn't need a prompt and will simply run a command and open another app.

```js
await hide()
// Do something like create a file then open it in VS Code
```

### submit

Submit a value of the currently focused prompt. Mostly used with actions, but can also be used with timeouts, errors, etc.

```js
let result = await arg(
  "Select",
  ["John", "Mindy", "Joy"],
  [
    {
      name: "Submit Sally",
      shortcut: `${cmd}+s`,
      onAction: () => {
        submit("Sally")
      },
    },
  ]
)

inspect(result) // Sally
```

### blur

### getClipboardHistory
### clearClipboardHistory
### getEditorHistory
### removeClipboardItem


### mainScript
### appKeystroke
### Key
### log
### warn
### keyboard
### mouse
### clipboard
### execLog
### focus

Force focus back to the prompt. Only useful when "ignoreBlur" is true and the user is focusing on another app.

### docs

Feed it a markdown file, it will create groups from the h2s and choices from the h3s.

```js
let value = await docs(kitPath("API.md"))
```

### getAppState
### registerShortcut
### unregisterShortcut
### startDrag
### eyeDropper

### toast

Show a dismissable toast message:

```js
await div({
  html: md(`# Patience is a virtue`),
  onInit: async () => {
    await wait(1000)
    await toast("One second has passed")
  },
  shortcuts: [
    {
      key: "cmd+shift+1",
      onPress: async () => {
        await toast("You pressed cmd+shift+1")
      },
    },
  ],
})
```

### mic
### micdot

### getMediaDevices
### getTypedText

### PROMPT

An object map of widths and heights used for setting the size of the prompt:

```js
await editor({
  width: PROMPT.WIDTH["3XL"],
  height: PROMPT.HEIGHT["3XL"],
})
```


### preventSubmit

A global Symbol used in combination with `onSubmit` to prevent the prompt from submitting.

```js
let result = await arg({
  onSubmit: input => {
    if (!input.includes("go")) {
      setHint("You must include the word 'go'")
      return preventSubmit
    }
  },
})

inspect(result)
```

## Process

### cwd

`cwd` is the current working directory of the process. 

- When launching a script from the app, the `kenv` containing the scripts dir will be the current working directory. 
- When launching a script from the terminal, the current working directory will be the directory you're in when you launch the script.

```js
// Example: Joining the current working directory with a filename to create an absolute path
const currentWorkingDirectory = process.cwd();
const fullPathToFile = path.join(currentWorkingDirectory, 'example.txt');
console.log(`The full path to the file is: ${fullPathToFile}`);
```

### pid
```js
// Example: Logging the process ID to find it in the Activity Monitor/Task Manager
const processId = process.pid;
console.log(`This process has the ID: ${processId}`);
```


### uptime
```js
// Example: Logging the uptime of the process
const uptimeInSeconds = process.uptime();
console.log(`The process has been running for ${uptimeInSeconds} seconds.`);
```
```
```

## Axios

### get
```js
const response = await get(url);
```

### put
```js
const response = await put(url, data);
```

### post
```js
const response = await post(url, data);
```

### patch
```js
const response = await patch(url, data);
```

## Chalk

### chalk
```js
const styledText = chalk.color('Hello World');
```

## Child Process

### spawn
```js
const child = child_process.spawn(command, args);
```

### spawnSync
```js
const result = child_process.spawnSync(command, args);
```

### fork
```js
const child = child_process.fork(modulePath, args);
```

## Custom

### ensureReadFile
```js
const fileContent = await ensureReadFile(filePath, defaultContent);
```

## Execa

### exec
```js
const { stdout } = await execa(command, args);
```

### execa
```js
const { stdout } = await execa(command, args);
```

### execaSync
```js
const { stdout } = execa.sync(command, args);
```

### execaCommand
```js
const { stdout } = await execa.command(command);
```

### execaCommandSync
```js
const { stdout } = execa.commandSync(command);
```

### execaNode
```js
const { stdout } = await execa.node(scriptPath, args);
```

## Download

### download
```js
await download(url, outputPath);
```

## FS-Extra

### emptyDir
```js
await fsExtra.emptyDir(directoryPath);
```

### ensureFile
```js
await fsExtra.ensureFile(filePath);
```

### ensureDir
```js
await fsExtra.ensureDir(directoryPath);
```

### ensureLink
```js
await fsExtra.ensureLink(srcPath, destPath);
```

### ensureSymlink
```js
await fsExtra.ensureSymlink(target, path);
```

### mkdirp
```js
await fsExtra.mkdirp(directoryPath);
```

### mkdirs
```js
await fsExtra.mkdirs(directoryPath);
```

### outputFile
```js
await fsExtra.outputFile(filePath, data);
```

### outputJson
```js
await fsExtra.outputJson(filePath, jsonObject);
```

### pathExists
```js
const exists = await fsExtra.pathExists(path);
```

### readJson
```js
const jsonObject = await fsExtra.readJson(filePath);
```

### remove
```js
await fsExtra.remove(path);
```

### writeJson
```js
await fsExtra.writeJson(filePath, jsonObject);
```

### move
```js
await fsExtra.move(srcPath, destPath);
```

## FS/Promises

### readFile
```js
const content = await readFile(filePath, encoding);
```

### writeFile
```js
await writeFile(filePath, data);
```

### appendFile
```js
await appendFile(filePath, data);
```

### readdir
```js
const files = await readdir(directoryPath);
```

### copyFile
```js
await copyFile(srcPath, destPath);
```

### stat
```js
const stats = await stat(path);
```

### lstat
```js
const stats = await lstat(path);
```

### rmdir
```js
await rmdir(directoryPath);
```

### unlink
```js
await unlink(filePath);
```

### symlink
```js
await symlink(target, path);
```

### readlink
```js
const linkString = await readlink(path);
```

### realpath
```js
const resolvedPath = await realpath(path);
```

### access
```js
await access(filePath, fs.constants.R_OK);
```

### rename
```js
await rename(oldPath, newPath);
```

## FS

### createReadStream
```js
const readStream = fs.createReadStream(filePath);
```

### createWriteStream
```js
const writeStream = fs.createWriteStream(filePath);
```

## Handlebars

### compile
```js
const template = Handlebars.compile(source);
const result = template(context);
```

## Marked

### md
```js
const html = marked(markdownString);
```

### marked
```js
const tokens = marked.lexer(markdownString);
const html = marked.parser(tokens);
```

## Crypto

### uuid
```js
const uniqueId = crypto.randomUUID();
```

## Replace-in-file

### replace
```js
const results = await replaceInFile({
  files: filePath,
  from: /searchRegex/g,
  to: 'replacementString',
});
```

## Stream

### Writable
```js
const writable = new stream.Writable({
  write(chunk, encoding, callback) {
    // Write logic here
    callback();
  }
});
```

### Readable
```js
const readable = new stream.Readable({
  read(size) {
    // Read logic here
  }
});
```

### Duplex
```js
const duplex = new stream.Duplex({
  read(size) {
    // Read logic here
  },
  write(chunk, encoding, callback) {
    // Write logic here
    callback();
  }
});
```

### Transform
```js
const transform = new stream.Transform({
  transform(chunk, encoding, callback) {
    // Transform logic here
    callback();
  }
});
```

## Globby

### globby
```js
let dmgFilePaths = await globby(home("Downloads", "*.dmg"));
let choices = dmgFilePaths.map((filePath) => {
  return {
    name: path.basename(filePath),
    value: filePath,
  };
});

let selectedDmgPath = await arg("Select", choices);
```

## Terminal Only

### stderr

Only useful when launching scripts from the terminal

```js
// Example: Writing an error message to the standard error stream
const errorMessage = 'An error occurred!';
stderr.write(`Error: ${errorMessage}\n`);
```

### stdin

Only useful when launching scripts from the terminal

```js
// Example: Reading user input from the standard input stream
stdin.setEncoding('utf-8');
console.log('Please enter your name:');
stdin.on('data', (name) => {
  console.log(`Hello, ${name.toString().trim()}!`);
  stdin.pause(); // Stop reading
});
```

### stdout

Only useful when launching scripts from the terminal

```js
// Example: Writing a message to the standard output stream
const message = 'Hello, World!';
process.stdout.write(`${message}\n`);
```


## Contribute

### Missing Something?

<!-- enter: Update Docs -->
<!-- value: download-md.js -->

These API docs are definitely incomplete and constantly evolving. If you're missing something, [suggest an edit](https://github.com/johnlindquist/kit/blob/main/API.md) to the docs or open an issue on GitHub. 

Press <kbd>Enter</kbd> to download the latest docs