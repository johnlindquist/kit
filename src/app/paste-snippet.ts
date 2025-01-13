// Name: Paste Snippet

import "@johnlindquist/kit"
import { getSnippet, templatePlaceholdersRegex } from "../core/utils.js"

let snippet = ""

let contents = await readFile(arg.filePath, "utf8")
let { metadata, snippet: snippetFromFile } = getSnippet(contents)
snippet = snippetFromFile.trim()

updateArgs(args);
if (args?.length > 0 && snippet.includes("$0")) {
    snippet = snippet.replaceAll("$0", args?.shift());
}

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

if (snippet.match(templatePlaceholdersRegex)) {
	setInput("") // clearing keyword
	snippet = await template(snippet, {
		description: "Fill in the template",
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
