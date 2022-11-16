// Name: Focus Window
// Description: List and focus open windows

import "@johnlindquist/kit"
import { backToMainShortcut } from "../core/utils.js"

let apps = await db(kitPath("db", "apps.json"))

let windows = await getMacWindows()

let ignore = [
  "Notification Center",
  "Dock",
  "AvatarPickerMemojiPicker",
  "com.apple.preference.security.r",
]

let selectedWindow = await arg<{
  name: string
  ownerName: string
  number: number
  pid: number
}>(
  {
    placeholder: "Focus Window",
    enter: "Focus",
    shortcuts: [backToMainShortcut],
    resize: true,
  },
  windows
    .filter(
      w => !ignore.includes(w.ownerName) && w.name !== ""
    )
    .map(w => {
      let img =
        (apps?.choices?.length ? apps.choices : []).find(
          a =>
            a.name == w.ownerName ||
            a.name.includes(w.ownerName)
        )?.img || ""
      return {
        name: w.ownerName,
        description: w.name,
        img,
        value: w,
      }
    })
)

await focusWindow(
  selectedWindow.ownerName,
  selectedWindow.name
)
