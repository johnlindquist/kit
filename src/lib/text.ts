import { Channel } from "../core/enum.js"

global.getSelectedText = async () => {
  await global.hide()

  await applescript(
    String.raw`tell application "System Events" to keystroke "c" using command down`
  )

  return await global.paste()
}

/**
@param text - a string to paste at the cursor
@example
```
await setSelectedText(`Script Kit is awesome!`)
```
*/

global.setSelectedText = async text => {
  await global.hide()

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

export {}
