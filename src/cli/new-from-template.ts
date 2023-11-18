// Description: Creates a new empty script you can invoke from the terminal

import { kitMode } from "../core/utils.js"
import { ensureTemplates } from "./lib/utils.js"

await ensureTemplates()

let kenvTemplatesPath = kenvPath("templates")
let templates = await readdir(kenvTemplatesPath)
let template = await arg(
  "Select a template",
  templates
    .filter(t => t.endsWith(kitMode()))
    .map(t => {
      let ext = path.extname(t)
      return t.replace(new RegExp(`${ext}$`), "")
    })
)

await cli("new", "--template", template)

export {}
