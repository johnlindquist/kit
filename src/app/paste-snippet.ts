// Name: Paste Snippet

import "@johnlindquist/kit"
import { getSnippet } from "../core/utils.js"

let snippet = ""

let contents = await readFile(arg.filePath, "utf8")
let { metadata, snippet: snippetFromFile } = getSnippet(contents)
snippet = snippetFromFile.trim()

// Find ${selection} and replace with selected text
if (snippet.includes("$SELECTION")) {
	let selectedText = await getSelectedText()
	snippet = snippet.replaceAll("$SELECTION", selectedText)
}

if (snippet.includes("$CLIPBOARD")) {
	let clipboard = await paste()
	snippet = snippet.replaceAll("$CLIPBOARD", clipboard)
}

if (snippet.includes("$HOME")) {
	snippet = snippet.replaceAll("$HOME", home())
}

if (snippet.match(/\${(.+)?}/) || snippet.match(/\$(?!\d)/)) {
	setInput(``) // clearing keyword
	snippet = await template(snippet, {
		description: "Fill in the template",
		shortcuts: [
			{
				key: `${cmd}+s`,
				name: "Paste Snippet",
				onPress: async (input) => {
					submit(input)
				},
				bar: "right"
			}
		]
	})
}
await setSelectedText(snippet)
