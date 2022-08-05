// Description: Google
setName(``)

import { cmd } from "../core/utils.js"

let { default: google } = await import("googlethis")
const options = {
  page: 0,
  safe: false,
  additional_params: {
    // add additional parameters here, see https://moz.com/blog/the-ultimate-guide-to-the-google-search-parameters and https://www.seoquake.com/blog/google-search-param/
    hl: "en",
  },
}

setFlags({
  ["paste-as-markdown"]: {
    name: "Paste Title as Markdown",
    description: "Convert the title and url to Markdown",
    shortcut: `${cmd}+p`,
  },
  ["paste-as-input-markdown"]: {
    name: "Paste Input as Markdown",
    description:
      "Convert the current input and url to Markdown",
    shortcut: `${cmd}+i`,
  },
  ["paste-url"]: {
    name: "Paste URL",
    description: "Paste the selected URL",
    shortcut: `${cmd}+u`,
  },
  ["paste-title"]: {
    name: "Paste Title",
    description: "Paste the selected title",
    shortcut: `${cmd}+t`,
  },
})

let currentInput = ``
let title = ``

let url = await arg(
  {
    input: (flag?.input as string) || "",
    placeholder: "Search Google",
    footer:
      "Enter to open in browser | Right arrow to see options",
    onChoiceFocus: async (_, { focused }) => {
      title = focused?.name
    },
  },
  async input => {
    if (!input || input?.length < 2)
      return md(`### Type at least 2 characters`)
    currentInput = input
    let response = await google.search(input, options)
    let definitions = response?.dictionary?.definitions
    // let examples = response?.dictionary?.examples
    let description = response?.knowledge_panel?.description
      ?.replace("N/A", "")
      ?.trim()
    let preview = definitions
      ? md(`${definitions?.map(d => `* ${d}`).join("\n")}`)
      : description
      ? md(`${description}`)
      : ""
    return response.results.map(r => {
      let url = new URL(r.url)
      let img = `https://icons.duckduckgo.com/ip3/${url.hostname}.ico`
      return {
        name: r.title,
        description: r.url,
        value: r.url,
        img,
        preview,
      }
    })
  }
)

if (flag?.["paste-as-markdown"]) {
  setSelectedText(`[${title}](${url})`)
} else if (flag?.["paste-as-input-markdown"]) {
  setSelectedText(`[${currentInput}](${url})`)
} else if (flag?.["paste-url"]) {
  setSelectedText(url)
} else if (flag?.["paste-title"]) {
  setSelectedText(title)
} else {
  if (url) open(url)
}

export {}
