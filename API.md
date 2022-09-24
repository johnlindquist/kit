# API

## arg

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
    let response = await get("https://swapi.dev/api/people/");
    return response?.data?.results.map((p) => p.name);
})
```

### arg with Async Choices Object

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

### arg with Generated Choices

```js
let char = await arg("Type then pick a char", (input) => { 
    // return an array of strings
    return input.split("")
})
```

### arg with Shortcuts

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

## div

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
await div(md(`
# Hello world!

## Thanks for coming to my demo
* This is a list
* This is another item
* This is the last item

`))
```

### div with Tailwind Classes

```js
await div(`Hello world!`, `bg-white text-black text-4xl p-4`)
```

### div with Submit Links

```js
let name = await div(md(`# Pick a Name
* [John](submit:John)
* [Mindy](submit:Mindy)
* [Joy](submit:Joy)
`))

await div(md(`# You selected ${name}`))
```

## dev

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
    age: 40
})
```

## editor

The `editor` function opens a text editor with the given text. The editor is a full-featured "Monaco" editor with syntax highlighting, find/replace, and more. The editor is a great way to edit or update text to write a file. The default language is markdown.


## Editor Hello World

```js
let content = await editor()
```

## Editor with Initial Content

```js
let content = await editor("Hello world!")
```

## Load Remote Text Content into Editor

```js
let response = await get(`https://raw.githubusercontent.com/johnlindquist/kit/main/API.md`)

let content = await editor(response.data)
```


## template

```js
await template()
```

## hotkey

```js
await hotkey()
```


## drop

Use `await drop()` to prompt the user to drop a file or folder.

```js
// Name: Drop Example

import "@johnlindquist/kit"

// Note: Dropping one or more files returns an array of file information
// Dropping text or an image from the browser returns a string
let fileInfos = await drop()

let filePaths = fileInfos.map(f => f.path).join(",")

await div(md(filePaths))
```

## selectFile

Prompt the user to select a file using the Finder dialog:

```js
let filePath = await selectFile()
```

## selectFolder

Prompt the user to select a folder using the Finder dialog:

```js
let folderPath = await selectFolder()
```

## Missing Something?

<!-- enter: Update Docs -->
<!-- value: download-md.js -->

These API docs are constantly evolving. If you're missing something, [suggest an edit](https://github.com/johnlindquist/kit/edit/main/API.md) to the docs or open an issue on GitHub.

Hit <kbd>Enter</kbd> to download the latest docs.