/**
@param keyString - Accepts string of shortcut
@example
```
await keystroke("command option e")
```
*/

export let keystorke = async (keyString: string) => {
  send("HIDE_APP")
  let keys = keyString.split(" ")
  if (keys.length < 2)
    throw new Error(`${keyString} isn't formatted properly`)

  let key = keys.pop()
  let modifiers = keys
    .map(modifier => `${modifier} down,`)
    .join(" ")
    .slice(0, -1)

  return await applescript(
    String.raw`
    tell application "System Events"
      keystroke "${key}" using {${modifiers}}
    end tell
    `
  )
}
