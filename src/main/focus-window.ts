// Name: Focus Window

import "@johnlindquist/kit"
import { backToMainShortcut } from "../core/utils.js"

let { getWindows } = await npm("mac-windows")

let apps = await db(kitPath("db", "apps.json"))

let windows = await getWindows({
  showAllWindows: true,
  onScreenOnly: false,
})

let ignore = ["Notification Center", "Dock"]

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
    .filter(w => !ignore.includes(w.name))
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
