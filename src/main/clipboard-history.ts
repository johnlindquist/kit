// Name: Clipboard History
// Description: Display and Paste Clipboard History
// Keyword: clip

import { Channel } from "../core/enum.js"
import {
  cmd,
  keywordInputTransformer,
} from "../core/utils.js"

let transformer = keywordInputTransformer(arg?.keyword)

function escapeHTML(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, function (m) {
    return map[m]
  })
}

let createPreview = (item, input) => {
  let content = escapeHTML(item.value)
  if (
    content === "__enable-clipboard__" ||
    content === "__authorize-clipboard__"
  ) {
    return ``
  }

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
        value: "__authorize-clipboard__",
      },
    ]
  }
  return (input: string) => {
    input = transformer(input)

    return history
      .filter(item => {
        return (
          input.length < 2 ||
          item.value
            .toLowerCase()
            .includes(input.toLowerCase())
        )
      })
      .map((item, index) => {
        if (index === 0) {
          setPreview(createPreview(item, input))
        }

        return {
          type: item.type,
          id: item.id,
          name:
            item.type === "image"
              ? path.basename(item.value)
              : item.name,
          value: item.value,
          preview: createPreview(item, input),
        }
      })
  }
}

let id = ``
let text = ""
let isImage = false
while (!text) {
  setResize(false)
  text = await arg(
    {
      debounceInput: 0,
      placeholder: "Hit enter to paste",
      enter: `Paste item`,
      itemHeight: PROMPT.ITEM.HEIGHT.XS,
      height: PROMPT.HEIGHT.BASE,
      resize: false,
      shortcuts: [
        {
          name: "Remove Selected",
          key: `${cmd}+backspace`,
          bar: "right",
          onPress: async (input, { focused }) => {
            if (focused?.id) {
              await removeClipboardItem(focused?.id)
            }

            submit("")
          },
        },
        {
          name: `Clear History`,
          key: `${cmd}+shift+backspace`,
          bar: "right",
          onPress: async () => {
            await clearClipboardHistory()
            submit("")
          },
        },
        {
          name: `Copy to Clipboard`,
          key: `${cmd}+c`,
          bar: "right",
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

        setPreview(createPreview(state?.focused, input))
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
    await historyWithPreviews()
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
    }
  }
}

export {}
