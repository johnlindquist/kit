// Name: Paste Snippet

import "@johnlindquist/kit"
import { getSnippet, templatePlaceholdersRegex } from "../core/utils.js"

let contents = await readFile(arg.filePath, "utf8")
let { metadata, snippet } = getSnippet(contents)

updateArgs(args);
if (args?.length > 0 && snippet.includes("$0")) {
	snippet = snippet.replaceAll("$0", args?.shift());
}

// Support both $SELECTION and $SELECTED_TEXT for consistency
if (snippet.includes("$SELECTION") || snippet.includes("$SELECTED_TEXT")) {
	let selectedText = await getSelectedText()
	snippet = snippet.replaceAll("$SELECTION", selectedText)
	snippet = snippet.replaceAll("$SELECTED_TEXT", selectedText)
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
