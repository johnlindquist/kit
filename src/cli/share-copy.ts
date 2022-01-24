//Menu: Copy Script to Clipboard
//Description: Copies Script to Clipboard

let { filePath } = await selectScript(`Share which script?`)

let content = await readFile(filePath, "utf8")
copy(content)

let message = `Copied content of "${path.basename(
  filePath
)}" to clipboard`

await div(
  md(`## ${message}

~~~js
${content}
~~~
`)
)

export {}
