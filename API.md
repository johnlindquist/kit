# API

## arg

The most common prompt for accepting user input.

### Details

1. The first argument is a string or a prompt configuration object.
2. The second argument is a list of choices, a string to render, or a function that returns choices or a string to render.

### Basic Usage

```js
let name = await arg("Enter your name")
```

### Standard Usage

```js
let color = await arg("Select a color", [
  "red",
  "green",
  "blue",
])
```

### Advanced Usage

```js
await arg()
```

## div

```js
await div()
```

## dev

```js
dev()
```

## editor

```js
await editor()
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
