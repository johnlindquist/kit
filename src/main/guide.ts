import { convertMarkdownToArg } from "./main-helper.js"

let markdownArg = await convertMarkdownToArg("GUIDE.md")
await markdownArg()

export {}
