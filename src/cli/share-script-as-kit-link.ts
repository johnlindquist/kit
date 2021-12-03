//Menu: Share Script as kit:// link
//Description: Create a base64 encoded link to share

let { filePath, command } = await selectScript(
  `Share which script?`
)

let contents = await readFile(filePath, "utf8")
let c = Buffer.from(contents).toString("base64url")

let link = `kit://snippet?name=${command}&content=${c}`

copy(link)
div(
  md(`Copied kit:// share link to clipboard
`),
  `flex justify-center items-center`
)
await wait(2000, null)

export {}
