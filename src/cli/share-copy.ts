//Menu: Copy Script to Clipboard
//Description: Copies Script to Clipboard

let { filePath } = await selectScript(`Share which script?`)

copy(await readFile(filePath, "utf8"))
div(md(
  `Copied content of "${path.basename(
    filePath
  )}" to clipboard`
))
await wait(1500)

export { }
