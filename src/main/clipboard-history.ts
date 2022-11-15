// Name: Clipboard History
// Description: Display and Paste Clipboard History

import { Choice } from "../types"
import { cmd, returnOrEnter } from "../core/utils.js"

setName(``)

let historyWithPreviews = async () => {
  let history = await getClipboardHistory()
  return history.map(item => {
    ;(item as Choice).preview = () =>
      `<div class="text-xs p-5 font-mono">${item.value}</div>`
    return item
  })
}
// setFlags({
//   ["remove"]: {
//     name: "Remove",
//     description: "Remove from Clipboard History",
//     shortcut: `${cmd}+backspace`,
//   },
//   ["template"]: {
//     name: "Template",
//     description:
//       "Create a Template Script from Clipboard Item",
//   },
// })
let id = ``
let value = await arg(
  {
    placeholder: "Hit enter to paste",
    enter: `Paste item`,
    shortcuts: [
      {
        name: "Remove",
        key: `${cmd}+backspace`,
        bar: "right",
        onPress: async (input, { focused }) => {
          if (focused?.id) {
            await removeClipboardItem(focused?.id)
          }
          setChoices(await historyWithPreviews())
        },
      },
      {
        name: `Clear Clipboard History`,
        key: `${cmd}+shift+backspace`,
        onPress: async () => {
          await clearClipboardHistory()
          setChoices(await historyWithPreviews())
        },
      },
    ],
    onChoiceFocus: async (input, state) => {
      id = state?.focused?.id
    },
  },
  await historyWithPreviews()
)

await setSelectedText(value)

export {}
