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