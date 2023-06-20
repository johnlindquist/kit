/*
# Google Search

Perform a basic Google search
*/

// Name: Google
// Description: Search Google for Information
// Pass: true

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
let currentInput = ``
let title = ``
let url = ``
let pasteOptions = async () => {
  let asMarkdown = `[${title}](${url})`
  let asInputMarkdown = `[${currentInput}](${url})`
  let result = await arg(
    {
      placeholder: "Paste",
      enter: "Paste",
    },
    [
      {
        name: `Site Title + URL`,
        description: asMarkdown,
        value: asMarkdown,
      },
      {
        name: `Input + URL`,
        description: asInputMarkdown,
        value: asInputMarkdown,
      },
      { name: `URL`, description: url, value: url },
      { name: `Title`, description: title, value: title },
    ]
  )
  setSelectedText(result)
}

await arg(
  {
    input:
      (flag?.input as string) ||
      (arg?.pass as string) ||
      "",
    placeholder: "Search Google",
    enter: `Open in Browser`,
    resize: true,
    shortcuts: [
      {
        name: `Paste Options`,
        key: `${cmd}+shift+v`,
        bar: `right`,
        onPress: pasteOptions,
      },
      {
        name: `Open and keep focus`,
        key: `${cmd}+enter`,
        bar: `right`,
        onPress: async () => {
          setAlwaysOnTop(true)
          setIgnoreBlur(true)
          open(url)
          setTimeout(focus, 100)
        },
      },
    ],
    onChoiceFocus: async (_, { focused }) => {
      title = focused?.name
      url = focused?.value
    },
  },
  async input => {
    if (!input || input?.length < 2)
      return [
        {
          name: `Type at least 2 characters`,
          disableSubmit: true,
        },
      ]
    currentInput = input
    let response = await google.search(input, options)

    return response.results.map(r => {
      let url = new URL(r.url)
      let img = `https://icons.duckduckgo.com/ip3/${url.hostname}.ico`
      return {
        name: r.title,
        description: r.url,
        value: r.url,
        img: r?.favicons?.high_res || img,
        preview: md(`# ${r.title}
${r.description}

${r.url}`),
      }
    })
  }
)
open(url)
