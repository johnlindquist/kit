// Description: Creates a new empty script you can invoke from the terminal

import { parseMetadata } from "../core/metadata.js"

let content = await paste()

let { name } = parseMetadata(content)
if (name) {
  arg.pass = name
}

arg.tip = content
await cli("new")

export {}
