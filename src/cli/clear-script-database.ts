// Description: Clear selected script database

let { filePath } = await selectScript(
  `Open database for which script?`
)

let { name, dir } = path.parse(filePath)

let dbPath = path.resolve(
  path.dirname(dir),
  "db",
  `_${name}.json`
)

let dbPathExists = await isFile(dbPath)

if (dbPathExists) {
  let contents = await readFile(dbPath, "utf-8")
  let highlightedContents = await highlight(
    `
## ${name}
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

  if (confirm !== "n") {
    await trash(dbPath)
  }
  let divP = div(
    md(`# Moved this file to trash:
\`${dbPath}\`
`)
  )
  await wait(1500)
  submit("")
  await divP
} else {
  await div(
    md(`
# No db found for <code>${name}</code>

\`${dbPath}\` not found
  `)
  )
}

await mainScript()

export {}
