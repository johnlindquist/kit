let { filePath, command } = await selectScript(
  `Open database for which script?`
)

let scriptDb = path.resolve(
  path.dirname(path.dirname(filePath)),
  "db",
  `_${command}.json`
)

await ensureReadFile(
  scriptDb,
  JSON.stringify({ items: [] })
)

await edit(scriptDb)

export {}
