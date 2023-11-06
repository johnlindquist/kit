// Name: Clipboard History
// Description: Display and Paste Clipboard History
// Keyword: c
// Cache: true

import { Channel } from "../core/enum.js"
import {
  cmd,
  escapeHTML,
  keywordInputTransformer,
} from "../core/utils.js"

let transformer = keywordInputTransformer(arg?.keyword)

let createPreview = (item, input) => {
  if (item.preview?.includes("img")) return item.preview
  let content = escapeHTML(item.value)

  if (item?.type === "image") {
    return `<div class="p-4 flex justify-center"><img src="${content}" /></div>`
  }

  let previewContent =
    input.length < 2
      ? content
      : content.replaceAll(
          new RegExp(input, "gi"),
          m => `<span class="text-primary">${m}</span>`
        )

  return `<div class="p-4 text-xs">${previewContent}</div>`
}

let historyWithPreviews = async () => {
  let history = await getClipboardHistory()

  if (history?.[0]?.value === "__watcher-disabled__") {
    setEnter("Start Clipboard Watcher")
    return [
      {
        name: `Clipboard access is not enabled`,
        description: `Press Enter to Start the Clipboard Watcher`,
        preview: `<div></div>`,
        value: "__enable-clipboard__",
      },
    ]
  }
  if (history?.[0]?.value === "__not-authorized__") {
    setEnter("Exit")
    return [
      {
        name: `Clipboard access is not authorized`,
        description: `Please open your system preferences and authorize access to the clipboard`,
        preview: `<div></div>`,
        value: "__authorize-clipboard__",
      },
    ]
  }
  if (history.length === 0) {
    return [
      {
        name: `Clipboard is empty`,
        description: `Copy something to the clipboard to see it here`,
        preview: `<div></div>`,
        value: "__empty__",
      },
    ]
  }

  return history.map((item, index) => {
    return {
      type: item.type,
      id: item.id,
      name:
        item.type === "image"
          ? path.basename(item.value)
          : item.name,
      value: item.value,
      preview: createPreview(item, ""),
    }
  })
}

let id = ``
let text = ""
let isImage = false
let keyword = arg?.keyword || ""
let defaultChoiceId = ""
while (!text) {
  let history = await historyWithPreviews()
  text = await arg(
    {
      defaultChoiceId,
      input: keyword + ` `,
      placeholder: "Hit enter to paste",
      enter: `Paste item`,
      itemHeight: PROMPT.ITEM.HEIGHT.XS,
      height: PROMPT.HEIGHT.BASE,
      resize: false,
      searchKeys: ["name", "preview"],
      shortcuts: [
        {
          name: "Remove Selected",
          key: `${cmd}+backspace`,
          bar: "right",
          visible: true,
          onPress: async (input, { focused }) => {
            let prevIndex =
              history.findIndex(c => c.id === focused?.id) +
              1

            defaultChoiceId =
              (history?.[prevIndex || 0] as any)?.id || ""

            if (focused?.id) {
              await removeClipboardItem(focused?.id)
            }

            submit("")
          },
        },
        {
          name: `Clear History`,
          key: `${cmd}+z`,
          onPress: async () => {
            await clearClipboardHistory()
            submit("")
          },
        },
        {
          name: `Copy to Clipboard`,
          key: `${cmd}+c`,
          onPress: async (input, { focused }: any) => {
            if (focused?.id) {
              await removeClipboardItem(focused?.id)
            }
            if (focused?.type === "image") {
              await clipboard.writeImage(
                await readFile(focused.value)
              )
            } else {
              await clipboard.writeText(focused?.value)
            }
            exit()
          },
        },
      ],
      onChoiceFocus: async (input, state) => {
        id = state?.focused?.id
        isImage = (state?.focused as any)?.type === "image"
        input = transformer(input)

        if (input && input.length > 2) {
          setPreview(createPreview(state?.focused, input))
        }
      },
      onInput: async (input, state) => {
        id = state?.focused?.id
        isImage = (state?.focused as any)?.type === "image"
        input = transformer(input)

        if (input && input.length > 2) {
          setPreview(createPreview(state?.focused, input))
        }
      },

      // onInput: async (input, state) => {
      //   let item = state?.focused
      //   input = transformer(input)
      //   // escape html of input
      //   input = input.replace(/&/g, "&amp;")
      //   let previewContent =
      //     input.length < 2
      //       ? item.value
      //       : item.value.replaceAll(
      //           new RegExp(input, "gi"),
      //           `<span class="text-primary">${input}</span>`
      //         )

      //   setPreview(
      //     `<div class="p-4 text-xs">${previewContent}</div>`
      //   )
      // },
    },
    history
  )
}

if (text) {
  if (text === "__enable-clipboard__") {
    await sendWait(Channel.TOGGLE_WATCHER)
  } else if (text === "__authorize-clipboard__") {
    exit()
  } else {
    await removeClipboardItem(id)
    if (isImage) {
      await clipboard.writeImage(await readFile(text))
      await hide()

      let pasteKeys = [
        isMac ? Key.LeftSuper : Key.LeftControl,
        Key.V,
      ]

      await keyboard.pressKey(...pasteKeys)
      await keyboard.releaseKey(...pasteKeys)
    } else {
      await setSelectedText(text)
      send(Channel.BEFORE_EXIT)
    }
  }
}

export {}
