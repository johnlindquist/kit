import { convertMarkdownToArg } from "./main-helper.js"

let markdownArg = await convertMarkdownToArg("API.md")
await markdownArg()

export {}
