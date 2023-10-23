// Name: Paste Snippet

import "@johnlindquist/kit"

let snippet = ""

let getSnippet = (
  contents: string
): {
  metadata: Record<string, string>
  snippet: string
} => {
  let lines = contents.split("\n")
  let metadata = {}
  let contentStartIndex = lines.length

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    let match = line.match(
      /(?<=^(?:(?:\/\/)|#)\s{0,2})([\w-]+)(?::)(.*)/
    )

    if (match) {
      let [, key, value] = match
      if (value) {
        metadata[key.trim().toLowerCase()] = value.trim()
      }
    } else {
      contentStartIndex = i
      break
    }
  }

  let snippet = lines.slice(contentStartIndex).join("\n")
  return { metadata, snippet }
}

let contents = await readFile(arg.filePath, "utf8")
let { metadata, snippet: snippetFromFile } =
  getSnippet(contents)
snippet = snippetFromFile.trim()

// Find ${selection} and replace with selected text
if (snippet.includes("${selection}")) {
  let selectedText = await getSelectedText()
  snippet = snippet.replaceAll("${selection}", selectedText)
}

if (snippet.match(/\${(.+)?}/)) {
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
