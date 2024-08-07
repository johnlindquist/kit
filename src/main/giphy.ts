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
import { infoPane, keywordInputTransformer } from "../core/utils.js"

let GIPHY_API_KEY = await env("GIPHY_API_KEY", {
	panel: md(
		"## Get a [Giphy API Key](https://developers.giphy.com/dashboard/)"
	),
	secret: true
})

let css = `
.focused {
  background: color-mix(in srgb, var(--color-secondary) calc(var(--ui-bg-opacity)* 100%), transparent);
}
.focused > img {
    border: 0.25rem solid var(--color-primary);        
}
`

let transformer = keywordInputTransformer(arg?.keyword)

let search = (q) =>
	`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${q}&limit=10&offset=0&rating=g&lang=en`

let giphy = async (input) => {
	input = transformer(input)
	if (!input) {
		return infoPane(
			"Search Giphy",
			"Search for a gif and paste it into your document."
		)
	}
	let query = search(input)
	let { data } = await get(query)
	let result = data.data.map((gif) => {
		return {
			name: gif.title.trim() || gif.slug,
			value: gif.images.original.url,
			html: `<img class="w-full" src="${gif.images.downsized.url}" alt="">`,
			focusedClassName: "focused"
		}
	})

	if (result.length === 0) {
		return infoPane("No results", "No results found for your search.")
	}
	return result
}

let formattedLink = await grid<string>(
	{
		input: (flag?.pass as string) || "",
		placeholder: "Search Giphy",
		css,
		columns: 3,
		enter: "Paste URL",
		preventCollapse: true,
		shortcuts: [
			{
				name: "Paste Markdown",
				key: `${cmd}+m`,
				bar: "right",
				onPress: (input, { focused }) => {
					submit(`![${input}](${focused.value})`)
				},
				visible: true
			},
			{
				name: "Paste <img>",
				key: `${cmd}+i`,
				bar: "right",
				onPress: (input, { focused }) => {
					submit(`<img src="${focused.value}" alt="${input}">`)
				},
				visible: true
			}
		]
	},
	giphy
)

await setSelectedText(formattedLink)
