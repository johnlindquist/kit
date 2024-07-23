// Name: Paste Snippet

import "@johnlindquist/kit"
import { getSnippet } from "../core/utils.js"

let snippet = ""

let contents = await readFile(arg.filePath, "utf8")
let { metadata, snippet: snippetFromFile } =
  getSnippet(contents)
snippet = snippetFromFile.trim()

// Find ${selection} and replace with selected text
if (snippet.includes("${selection}")) {
  let selectedText = await getSelectedText()
  snippet = snippet.replaceAll("${selection}", selectedText)
}

if (
  snippet.match(/\${(.+)?}/) ||
  snippet.match(/\$(?!\d)/)
) {
  setInput(``) // clearing keyword
  snippet = await template(snippet, {
    description: "Fill in the template",
    shortcuts: [
      {
        key: `${cmd}+s`,
        name: "Paste Snippet",
        onPress: async input => {
          submit(input)
        },
        bar: "right",
      },
    ],
  })
}
await setSelectedText(snippet)
