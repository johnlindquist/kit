//Menu: Share Script to ScriptKit.com
//Description: Copy script to clipboard and open ScriptKit.com to create a new script

let { filePath } = await selectScript(
  `Share which script?`
)

const content = await readFile(filePath, "utf8")
await clipboard.writeText(content)
await notify({
  title: "Script contents copied to clipboard",
  body: "Opening scriptkit.com/new to paste script"
})

await open(`https://scriptkit.com/new`)

export {}