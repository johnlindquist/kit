//Menu: Share Script to ScriptKit.com
//Description: Copy script to clipboard and open ScriptKit.com to create a new script

let { filePath } = await selectScript(
  `Share which script?`
)

const content = await readFile(filePath, "utf8")
await clipboard.writeText(content)

// Convert script content to base64 for URL parameter
let script_b64 = Buffer.from(content).toString("base64")

await notify({
  title: "Script contents copied to clipboard",
  body: "Opening scriptkit.com/new to paste script"
})

await open(`https://scriptkit.com/new?script_b64=${script_b64}`)

export {}