let { filePath } = await selectScript(
  "Select Script to Pull Kenv"
)

let kPath = path.dirname(path.dirname(filePath))

await cli("kenv-pull", kPath)

export {}
