// Name: Clipboard History
// Description: Display and Paste Clipboard History

import { Choice } from "../types"
import { cmd, returnOrEnter } from "../core/utils.js"

let historyWithPreviews = async () => {
  let history = await getClipboardHistory()

  return input => {
    return history
      .filter(item => {
        return (
          input.length < 2 ||
          item.value
            .toLowerCase()
            .includes(input.toLowerCase())
        )
      })
      .map(item => {
        let previewContent =
          input < 2
            ? item.value
            : item.value.replaceAll(
                new RegExp(input, "gi"),
                `<span class="text-primary">${input}</span>`
              )

        return {
          name: item.name,
          value: item.value,
          preview: `<div class="p-4">${previewContent}</div>`,
        }
      })
  }
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
    itemHeight: PROMPT.ITEM.HEIGHT.SM,
    shortcuts: [
      {
        name: "Remove",
        key: `${cmd}+backspace`,
        bar: "right",
        onPress: async (input, { focused }) => {
          if (focused?.id) {
            await removeClipboardItem(focused?.id)
          }
          let history = await historyWithPreviews()
          setChoices(history(""))
        },
      },
      {
        name: `Clear Clipboard History`,
        key: `${cmd}+shift+backspace`,
        onPress: async () => {
          await clearClipboardHistory()
          let history = await historyWithPreviews()
          setChoices(history(""))
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
