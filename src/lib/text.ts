import { Channel } from "../core/enum.js"

global.getSelectedText = async () => {
  await global.hide()
  // if (process.env.KIT_CONTEXT === "app") await wait(250)

  await applescript(
    String.raw`tell application "System Events" to keystroke "c" using command down`
  )

  return await global.paste()
}

/**
@param text - A String to Paste at the Cursor
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
