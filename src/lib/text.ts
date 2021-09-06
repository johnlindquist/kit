import { Channel } from "@core/enum"

export let getSelectedText = async () => {
  send(Channel.HIDE_APP)

  await applescript(
    String.raw`tell application "System Events" to keystroke "c" using command down`
  )

  return await paste()
}

/**
@param text - a string to paste at the cursor
@example
```
await setSelectedText(`Script Kit is awesome!`)
```
*/

export let setSelectedText = async text => {
  send(Channel.HIDE_APP)

  await applescript(
    String.raw`set the clipboard to "${text.replaceAll(
      '"',
      '\\"'
    )}"`
  )

  await applescript(
    String.raw`tell application "System Events" to keystroke "v" using command down`
  )

  await applescript(String.raw`set the clipboard to ""`)
}
