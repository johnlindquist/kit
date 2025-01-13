// Name: Snippets
// Description: Quickly insert snippets of text
// Cache: true
// Keyword: s

import "@johnlindquist/kit"
import slugify from "slugify"
import { closeShortcut, parseSnippets, getSnippet, templatePlaceholdersRegex } from "../core/utils.js"
import type { Snippet } from "../types/core.js"

let snippetChoices = await parseSnippets()
let defaultSnippetTemplate = `// Name: \${1:Required}
\${0}`

// TODO: Check "exclude" metadata isn't filtering out snippets
let snippet = await arg(
	{
		placeholder: "Choose a snippet",
		enter: "Paste Snippet",
		shortcuts: [
			{
				key: `${cmd}+n`,
				visible: true,

				name: "New Snippet",
				onPress: async () => {
					setInput("") // clearing keyword

					let contents = await template(defaultSnippetTemplate, {
						shortcuts: [
							closeShortcut,
							{
								key: `${cmd}+s`,
								name: "Save Snippet",
								onPress: (input) => {
									submit(input)
								},
								bar: "right"
							}
						]
					})
					let { metadata } = getSnippet(contents)
					await ensureDir(kenvPath("snippets"))
					await writeFile(
						kenvPath(
							"snippets",
							`${slugify(metadata.name, {
								lower: true,
								trim: true
							})}.txt`
						),
						contents
					)
				},
				bar: "right"
			},
			{
				key: `${cmd}+o`,
				name: "Edit Snippet",
				onPress: async (input, state) => {
					await edit(state?.focused?.description)
					exit()
				},
				bar: "right",
				visible: true
			}
		]
	},
	snippetChoices.concat({
		name: "No snippets found...",
		miss: true,
		nameClassName: "text-primary"
	} as Snippet)
)

let text = ""
if (typeof snippet?.text === "string") {
	text = snippet.text
} else if (typeof snippet?.value === "string") {
	text = snippet.value
} else if (typeof snippet === "string") {
	text === snippet
} else {
	throw new Error("Couldn't find snippet...")
}
snippet = text.replaceAll("\\$", "$")

if (snippet.includes("$SELECTED_TEXT")) {
	let selectedText = await getSelectedText()
	snippet = snippet.replaceAll("$SELECTED_TEXT", selectedText)
}

if (snippet.includes("$CLIPBOARD")) {
	let clipboardText = await paste()
	snippet = snippet.replaceAll("$CLIPBOARD", clipboardText)
}

if (snippet.match(templatePlaceholdersRegex)) {
	setInput("") // clearing keyword
	snippet = await template(snippet, {
		shortcuts: [
			{
				key: `${cmd}+s`,
				name: "Paste Snippet",
				onPress: (input) => {
					submit(input)
				},
				bar: "right"
			}
		]
	})
}
await setSelectedText(snippet)
