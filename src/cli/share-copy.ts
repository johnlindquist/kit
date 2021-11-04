//Menu: Copy Script to Clipboard
//Description: Copies Script to Clipboard

let { filePath } = await selectScript(`Share which script?`)

copy(await readFile(filePath, "utf8"))
console.log(
  `Copied content of "${path.basename(
    filePath
  )}" to clipboard`
)
await wait(2000)

export {}
