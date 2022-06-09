import { Channel } from "../core/enum.js"

global.getSelectedText = async () => {
  await global.hide()
  // if (process.env.KIT_CONTEXT === "app") await wait(250)

  await keyboard.pressKey(8, 47)
  await keyboard.releaseKey(8, 47)
  // await applescript(
  //   String.raw`tell application "System Events" to keystroke "c" using command down`
  // )

  return await global.paste()
}

/**
@param text - A String to Paste at the Cursor
@example
```
await setSelectedText(`Script Kit is awesome!`)
```
*/

global.setSelectedText = async (text = "", hide = true) => {
  if (hide) await global.hide()

  let prevText = await global.paste()

  await applescript(
    String.raw`set the clipboard to "${text?.replaceAll(
      '"',
      '\\"'
    )}"`
  )

  // await applescript(
  //   String.raw`tell application "System Events" to keystroke "v" using command down`
  // )

  await keyboard.pressKey(8, 66)
  await keyboard.releaseKey(8, 66)
  await wait(250)

  if (typeof prevText === "string")
    await global.copy(prevText)
}

export {}
