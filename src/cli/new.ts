// Description: Create a new script
import {
  exists,
  kitMode,
  selectKenv,
} from "../core/utils.js"
let generate = await npm("project-name-generator")

let examples = Array.from({ length: 3 })
  .map((_, i) => generate({ words: 2 }).dashed)
  .join(", ")

let name = await arg({
  placeholder:
    arg?.placeholder || "Enter a name for your script:",
  validate: exists,
  hint: `examples: ${examples}`,
})

let { dirPath: selectedKenvPath } = await selectKenv()

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

let defaultTemplatePath = kenvPath(
  "templates",
  "default.js"
)

if (!(await pathExists(defaultTemplatePath))) {
  let defaultTemplateContents = await readFile(
    kitPath("templates", "scripts", "default.js"),
    "utf-8"
  )
  await outputFile(
    defaultTemplatePath,
    defaultTemplateContents
  )
}

let template =
  arg?.template ||
  (await env("KIT_TEMPLATE", {
    choices: async () => {
      return (await readdir(kenvPath("templates"))).map(
        stripExtension
      )
    },
  }))

let templateContent = await readFile(
  kenvPath("templates", `${template}.${kitMode()}`),
  "utf8"
)

let templateCompiler = compile(templateContent)
contents += templateCompiler({ name, ...env })

if (arg?.url) {
  contents = (await get(arg?.url)).data
}

mkdir("-p", path.dirname(scriptPath))
await writeFile(scriptPath, contents)

await cli("create-bin", "scripts", name)

console.log(
  chalk`\nCreated a {green ${name}} script using the {yellow ${template}} template`
)

edit(scriptPath, kenvPath(), 3)

export {}
