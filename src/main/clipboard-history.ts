import { Choice } from "../types"

setName(``)

let history = await getClipboardHistory()

let historyWithPreviews = history.map(item => {
  ;(item as Choice).preview = () =>
    `<div class="text-xs p-5 font-mono">${item.value}</div>`
  return item
})
let value = await arg(
  "Hit enter to paste",
  historyWithPreviews
)

await setSelectedText(value)

export {}
