# Tips

Tips are a collection of answers to user questions in GitHub Discussions and our Discord organized by topic.

## Prompt

### Allow Any Text Input When Choices Are Displayed

By default, `arg` is in "strict" mode which prevents submitting the prompt if your text input doesn't match a choice in the list. You can disable this by passing `strict: false` to `arg`:

```js
// Name: Strict Mode Demo

import "@johnlindquist/kit"

let fruit = await arg({
    placeholder: "Select a fruit",
    hint: "Type 'Grape' and hit enter",
    strict: false
}, ["Apple", "Banana", "Cherry"])

await div(md(fruit))
```

### Select a Choice with a Single Keystroke

Surround a letter in square brackets to make it a shortcut for a choice:

```js
// Name: Single Keystroke Demo

import "@johnlindquist/kit"

let choice = await arg({
  placeholder: "Choose a color",
  choices: [
    {name: "[R]ed", value: "red"},
    {name: "[G]reen", value: "green"},
    {name: "[B]lue", value: "blue"},
  ],
})

await div(md(`You chose ${choice}`))
```

### Adjust the CSS of Choices

You can pass a `css` object to `arg` to adjust the CSS of the choices, then use the `className` property of each choice to apply a class to that choice:

```js
import "@johnlindquist/kit"

let choice = await arg({
  css: `
.light-purple {
  background-color: #c8a2c8;
}  
.medium-purple {
  background-color: #967bb6;
}
.dark-purple {
  background-color: #5d4777;
}

.focused {
  box-shadow: inset .5rem 0 0 0 #ffffffee;
}
  `,
  placeholder: "Choose a shade of purple",
  choices: [
    { name: "[L]ight Purple", value: "light-purple", className: "light-purple", focusedClassName: "focused" },
    { name: "[M]edium Purple", value: "medium-purple", className: "medium-purple", focusedClassName: "focused" },
    { name: "[D]ark Purple", value: "dark-purple", className: "dark-purple", focusedClassName: "focused" },
  ],
})

await div(md(`You chose ${choice}`))
```

## Progress Panel

```js
// Name: Progress Panel

import "@johnlindquist/kit"

let first = ""
let second = ""
let third = ""
let progressPanel = () =>
  md(`# Progress: 
- ${first || "Waiting first value"}
- ${second || "Waiting second value"}
- ${third || "Waiting third value"}
`)

first = await arg("Enter the first value", progressPanel)
second = await arg("Enter the second value", progressPanel)
third = await arg("Enter the third value", progressPanel)

await div(
  md(`# You entered:
- ${first}
- ${second}
- ${third}
`)
)
```

### Force a User to Pick an Option

```js
// Name: Force a User to Pick an Option

import "@johnlindquist/kit"

let animals = ["dog", "cat", "rabbit", "horse", "elephant"]
let secondsRemaining = 3
let getHint = secondsRemaining => `Hurry! You only have ${secondsRemaining} seconds to choose an animal...`

let animal = ""

animal = await arg(
  {
    hint: getHint(secondsRemaining),
    onInit: async () => {
      while (secondsRemaining > 0 && !animal) {
        setHint(getHint(secondsRemaining))
        await wait(1000)
        secondsRemaining--
      }

      if (!animal) exit()
    },
  },
  animals
)

await div(md(`# Phew! You made it! You chose ${animal}`))
```


## Clipboard

### Format Latest Clipboard Item

```js
import "@johnlindquist/kit"

let text = await paste()
let newText = text.replace("a", "b")
await setSelectedText(newText)
```

## Shortcuts

### Return to the Main Script on Escape

```js
await div({
  html: md(`# Hello`),
  shortcuts: [
    {
      key: "escape",
      onPress: async () => {
        await mainScript()
      },
    },
  ],
})
```

## Data

### Edit the Keys and Values of an Object

```js
import "@johnlindquist/kit"

let data = {
  name: "John",
  age: 42,
  location: "USA",
}

let result = await fields(
  Object.entries(data).map(([key, value]) => ({
    name: key,
    label: key,
    value: String(value),
  }))
)

let newData = Object.entries(data).map(([key], i) => ({
  [key]: result[i],
}))

inspect(newData)
```

## Prompt

### Rewind Prompts

```js
import { Shortcut } from "@johnlindquist/kit"

let currentStep = 0
let direction = 1

let shortcuts: Shortcut[] = [
  {
    key: "escape",
    onPress: async () => {
      submit("")
    },
  },
]

let step1 = async () =>
  await arg({
    placeholder: "one",
    shortcuts,
  })

let step2 = async () =>
  await arg({
    placeholder: "two",
    shortcuts,
  })

let step3 = async () =>
  await arg({
    placeholder: "three",
    shortcuts,
  })

let steps = [
  { prompt: step1, value: "" },
  { prompt: step2, value: "" },
  { prompt: step3, value: "" },
]

while (currentStep < steps.length) {
  let step = steps[currentStep]
  step.value = await step.prompt()
  direction = step.value ? 1 : -1
  currentStep += direction
  if (currentStep < 0) {
    exit() // Pressing escape on the first prompt will exit the script
  }
}

inspect(steps)
```

## Audio

### Cancel Audio with Keyboard Shortcut

```js
import "@johnlindquist/kit"

// Start saying long thing
say(`I have so much to say I'm just going to keep talking until someone shuts me up`)

registerShortcut("opt x", () => {
  say("") //will cancel
  process.exit() // you need to exit or else the shortcuts will keep the script active
})

registerShortcut("opt y", () => {
  say("You're done", {
    name: "Alice",
    rate: 0.5,
    pitch: 2,
  })
  process.exit()
})
```

## Desktop

### Get Active App on Mac

```js
// MAC ONLY!
import "@johnlindquist/kit"

// Always hide immmediately if you're not going to show a prompt
await hide()

// Note: This uses "https://www.npmjs.com/package/@johnlindquist/mac-frontmost" inside Kit.app,
// but you can import that package directly (or another similar package) if you prefer
let info = await getActiveAppInfo()
if (info.bundleIdentifier === "com.google.Chrome"){
  await keyboard.pressKey(Key.LeftSuper, Key.T)
  await keyboard.releaseKey(Key.LeftSuper, Key.T)
}
```