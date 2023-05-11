let { filePath } = await selectScript(
  "Select Script to Push Kenv"
)

let kPath = path.dirname(path.dirname(filePath))

await cli("kenv-push", kPath)

export {}
