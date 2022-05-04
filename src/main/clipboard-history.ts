import { Choice } from "../types"
import { cmd, returnOrEnter } from "../core/utils.js"
// Description: Clipboard History
setName(``)

let historyWithPreviews = async () => {
  let history = await getClipboardHistory()
  return history.map(item => {
    ;(item as Choice).preview = () =>
      `<div class="text-xs p-5 font-mono">${item.value}</div>`
    return item
  })
}
setFlags({
  ["remove"]: {
    name: "Remove",
    description: "Remove from Clipboard History",
    shortcut: `${cmd}+backspace`,
  },
  ["template"]: {
    name: "Template",
    description:
      "Create a Template Script from Clipboard Item",
  },
})
let id = ``
let value = await arg(
  {
    placeholder: "Hit enter to paste",
    onShortcut: {
      [cmd + "+shift+backspace"]: async () => {
        clearClipboardHistory()
        setChoices(await historyWithPreviews())
      },
    },
    onChoiceFocus: async (input, state) => {
      id = state?.focused?.id
    },
    footer: `Paste Item: ${returnOrEnter} | Remove Item: ${cmd}+delete | Clear History: ${cmd}+shift+delete`,
  },
  await historyWithPreviews()
)
if (flag?.remove) {
  await removeClipboardItem(id)
  await run(kitPath("main", "clipboard-history.js"))
} else if (flag?.template) {
  memoryMap.set("template", value)
  let script = await arg("Enter a Template Script Name")

  await run(
    `${kitPath(
      "cli",
      "new"
    )}.js --template clipboard-template ${script
      .trim()
      .replace(/\s/g, "-")
      .toLowerCase()} --scriptName '${script.trim()}'`
  )
} else {
  await setSelectedText(value)
}

export {}
