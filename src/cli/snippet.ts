// Description: Create a new script
import {
  exists,
  kitMode,
  returnOrEnter,
  uniq,
} from "../core/utils.js"
import {
  ensureTemplates,
  prependImport,
} from "./lib/utils.js"
import { generate } from "@johnlindquist/kit-internal/project-name-generator"
import { stripMetadata } from "../core/utils.js"

let previewContent = ``
if (arg?.content) {
  previewContent = Buffer.from(
    arg.content,
    "base64url"
  ).toString()
  if (!arg?.keepMetadata)
    previewContent = stripMetadata(previewContent)
  previewContent = "\n\n```js\n" + previewContent + "\n```"
}
let containerClasses = "p-5 prose dark:prose-dark prose-sm"
let examples = Array.from({ length: 3 })
  .map((_, i) => generate({ words: 2 }).dashed)
  .join(", ")

let header = `# Script Content`
let panel = await highlight(
  header + previewContent,
  containerClasses
)

let name = await arg(
  {
    placeholder:
      arg?.placeholder || "Enter a Name for Your Script",
    hint: `e.g., <span class="pl-2 font-mono">${examples}</span>`,
    validate: input => {
      return exists(input.replace(/\s/g, "-").toLowerCase())
    },
    enter: `Create Script and Open in Editor`,
  },
  panel
)
let { dirPath: selectedKenvPath } = await selectKenv(
  {
    placeholder: `Select Where to Create Script`,
    enter: "Create Script in Selected Kenv",
  },
  /^examples$/
)
name = name
  .replace(/[^\w\s]/g, "")
  .replace(/\s/g, "-")
  .toLowerCase()
let scriptPath = path.join(
  selectedKenvPath,
  "scripts",
  `${name}.${kitMode()}`
)
let contents = [arg?.npm]
  .flatMap(x => x)
  .filter(Boolean)
  .map(npm => `let {} = await npm("${npm}")`)
  .join("\n")
let stripExtension = fileName =>
  fileName.replace(path.extname(fileName), "")
await ensureTemplates()
let ext = `.${kitMode()}`
let template =
  arg?.template ||
  (await env("KIT_TEMPLATE", {
    choices: uniq(
      (
        await readdir(kenvPath("templates"))
      ).map(stripExtension)
    ),
  }))
let templatePath = kenvPath(
  "templates",
  `${template}${ext}`
)
let templateExists = await pathExists(templatePath)
if (!templateExists) {
  console.log(
    `${template} template doesn't exist. Creating blank ./templates/${template}${ext}`
  )
  await copyFile(
    kitPath("templates", "scripts", `default${ext}`),
    kenvPath("templates", `${template}${ext}`)
  )
}
let templateContent = await readFile(templatePath, "utf8")
let templateCompiler = compile(templateContent)
contents += templateCompiler({ name, ...env })
if (arg?.content) {
  contents = Buffer.from(
    arg.content,
    "base64url"
  ).toString()
  if (!arg?.keepMetadata)
    contents = stripMetadata(contents, [
      "Menu",
      "Name",
      "Author",
      "Twitter",
      "Alias",
      "Description",
    ])
}
contents = contents.trim()
contents = prependImport(contents)
await ensureDir(path.dirname(scriptPath))
await writeFile(scriptPath, contents)
await cli("create-bin", "scripts", name)
global.log(
  chalk`\nCreated a {green ${name}} script using the {yellow ${template}} template`
)
edit(scriptPath, kenvPath(), 3)
