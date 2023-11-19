# Tips

Tips are a collection of answers to user questions in GitHub Discussions and our Discord organized by topic.

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