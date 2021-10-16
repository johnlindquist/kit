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

let templatesPath = kenvPath("templates")

if (!(await pathExists(templatesPath))) {
  let defaultTemplatePath = kenvPath(
    "templates",
    "default.js"
  )

  let defaultTemplateContents = await readFile(
    kitPath("templates", "scripts", "default.js"),
    "utf-8"
  )
  await outputFile(
    defaultTemplatePath,
    defaultTemplateContents
  )

  let tsDefaultTemplatePath = kenvPath(
    "templates",
    "default.ts"
  )
  await copyFile(
    kitPath("templates", "scripts", "default.ts"),
    tsDefaultTemplatePath
  )
}

let ext = `.${kitMode()}`

let template =
  arg?.template ||
  (await env("KIT_TEMPLATE", {
    choices: _.uniq(
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
