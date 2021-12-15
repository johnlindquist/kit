// Description: Creates a new empty script you can invoke from the terminal

import { exists, kitMode } from "../core/utils.js"
import { ensureTemplates } from "./lib/utils.js"

let name = await arg({
  placeholder: "Enter a name for your script:",
  validate: exists,
})

let scriptPath = path.join(
  kenvPath("scripts"),
  name + ".js"
)

let contents = [arg?.npm]
  .flatMap(x => x)
  .filter(Boolean)
  .map(npm => `let {} = await npm("${npm}")`)
  .join("\n")

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

let templateContent = await readFile(
  kenvPath("templates", `${template}.${kitMode()}`),
  "utf8"
)

let templateCompiler = compile(templateContent)
contents += templateCompiler({ name, ...env })

if (arg?.url) {
  contents = (await get<string>(arg?.url)).data
}

await writeFile(scriptPath, contents)

await cli("create-bin", "scripts", name)

global.log(
  chalk`\nCreated a {green ${name}} script using the {yellow ${template}} template`
)

edit(scriptPath, kenvPath())

export {}
