//Menu: Share Script as kit:// link
//Description: Create a base64 encoded link to share

let { filePath, command } = await selectScript(
  `Share which script?`
)

let contents = await readFile(filePath, "utf8")
let c = Buffer.from(contents).toString("base64url")

let link = `kit://snippet?name=${command}&content=${c}`

copy(link)

let message = `Copied kit:// share link to clipboard`

await div(
  md(`## ${message}

[${link}](${link})
`)
)

export {}
