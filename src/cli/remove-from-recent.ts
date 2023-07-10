// Description: Remove a script timestamp

let script = await selectScript(`Remove a script:`)

let { filePath } = script
await global.removeTimestamp(filePath)
await mainScript()

export {}
