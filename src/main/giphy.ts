/* 
# Paste a Gif from Giphy
- Prompts the user for a Giphy API key to store in the .env
- Opens a prompt to search gifs from Giphy
- Paste Gif per user's choice
*/

// Name: Giphy
// Description: Search and Paste Gifs
// Author: John Lindquist
// Twitter: @johnlindquist
// Pass: true
// keyword: g

import "@johnlindquist/kit"
import { keywordInputTransformer } from "../core/utils.js"

let GIPHY_API_KEY = await env("GIPHY_API_KEY", {
  panel: md(
    `## Get a [Giphy API Key](https://developers.giphy.com/dashboard/)`
  ),
  secret: true,
})

let transformer = keywordInputTransformer(arg?.keyword)

let search = q =>
  `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${q}&limit=10&offset=0&rating=g&lang=en`

let giphy = async input => {
  input = transformer(input)
  if (!input) {
    return [
      {
        name: "Begin Typing to Search Giphy",
        skip: true,
        info: true,
      },
    ]
  }

  let query = search(input)
  let { data } = await get(query)

  return data.data.map(gif => {
    return {
      name: gif.title.trim() || gif.slug,
      value: gif.images.original.url,
      preview: `<img class="w-full" src="${gif.images.downsized.url}" alt="">`,
    }
  })
}

let formattedLink = await arg(
  {
    input: (flag?.pass as string) || "",
    placeholder: "Search Giphy",
    enter: "Paste URL",
    preventCollapse: true,
    shortcuts: [
      {
        name: "Paste Markdown Link",
        key: `${cmd}+m`,
        bar: "right",
        onPress: (input, { focused }) => {
          submit(`![${input}](${focused.value})`)
        },
      },
      {
        name: "HTML <img>",
        key: `${cmd}+i`,
        bar: "right",
        onPress: (input, { focused }) => {
          submit(
            `<img src="${focused.value}" alt="${input}">`
          )
        },
      },
    ],
  },
  giphy
)

await setSelectedText(formattedLink)
