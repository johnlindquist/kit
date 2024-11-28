import { Channel } from "../core/enum.js"

global.getSelectedText = async () => {
  await global.hide()

  await sendWait(Channel.KEYBOARD_COPY)

  const result = await global.paste()

  if (result?.replace(/[\r\n]/g, "") === "") {
    return ""
  }

  return result
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

  return await sendWait(Channel.SET_SELECTED_TEXT, {
    text,
    hide,
  })
}

global.cutText = () => sendWait(Channel.CUT_TEXT)

export {}
