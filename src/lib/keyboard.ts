/**
@param shortcut - Accepts string of shortcut
@example
```
await shortcut("command option e")
```
*/

export let shortcut = async (shortcutString: string) => {
  send("HIDE_APP")
  let keys = shortcutString.split(" ")
  if (keys.length < 2)
    throw new Error(
      `${shortcutString} isn't formatted properly`
    )

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
