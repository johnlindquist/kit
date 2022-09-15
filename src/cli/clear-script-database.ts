// Description: Clear selected script database

let { filePath, command } = await selectScript(
  `Open database for which script?`
)

let dbPath = path.resolve(
  filePath,
  "..",
  "..",
  "db",
  `_${command}.json`
)

let dbPathExists = await pathExists(dbPath)

if (dbPathExists) {
  let contents = await readFile(dbPath, "utf-8")
  let highlightedContents = await highlight(
    `
## ${command}
~~~json
${contents}
~~~`
  )
  let confirm = await arg(
    {
      placeholder: `Delete script data?`,
      hint: `[y]es/[n]o`,
    },
    highlightedContents
  )

  if (confirm === "y") {
    await trash(dbPath)
  }
} else {
  await div(
    md(`
## No data found for <code>${command}</code>
  `)
  )
}

await mainScript()

export {}
