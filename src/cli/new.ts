// Name: New
// Description: Create a new script
// Log: false

import {
  exists,
  kitMode,
  returnOrEnter,
  stripMetadata,
} from "../core/utils.js"
import {
  ensureTemplates,
  prependImport,
} from "./lib/utils.js"
import { generate } from "@johnlindquist/kit-internal/project-name-generator"

let examples = Array.from({ length: 3 })
  .map((_, i) => generate({ words: 2 }).dashed)
  .join(", ")

let onInput = async input => {
  if (input) {
    let scriptName = input
      .replace(/[^\w\s]/g, "")
      .replace(/\s/g, "-")
      .toLowerCase()

    setPanel(
      md(`# Create <code>${scriptName}</code>
  
  Type <kbd>${returnOrEnter}</kd> to create a script named <code>${scriptName}</code>
      `)
    )
  }
}

let name = await arg(
  {
    placeholder:
      arg?.placeholder || "Enter a name for your script:",
    hint: `e.g., ${examples}`,
    validate: input => {
      return exists(input.replace(/\s/g, "-").toLowerCase())
    },
    enter: `Create script and open in editor`,
  },
  onInput
)

// div(md(`## Opening ${name}...`))

let { dirPath: selectedKenvPath } = await selectKenv({
  placeholder: `Select Where to Create Script`,
  enter: "Create Script in Selected Kenv",
})

let stripName = (name: string) =>
  path.parse(name.trim().replace(/\s/g, "-").toLowerCase())
    .name

let scriptPath = path.join(
  selectedKenvPath,
  "scripts",
  `${stripName(name)}.${kitMode()}`
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
contents += templateCompiler({
  ...env,
  ...Object.fromEntries(memoryMap),
  name: arg?.scriptName || name,
})
if (!contents.includes(`Name:`)) {
  contents = `// Name: ${arg?.scriptName || name || ""}
${contents.startsWith("/") ? contents : "\n" + contents}
`
}

if (arg?.url || arg?.content) {
  contents = (await get<any>(arg?.url)).data
  if (!arg?.keepMetadata) {
    contents = stripMetadata(contents, [
      "Menu",
      "Name",
      "Author",
      "Twitter",
      "Alias",
      "Description",
    ])
  }
}

if (arg?.url) {
  scriptPath = scriptPath.replace(
    /\.(js|ts)$/g,
    path.extname(arg?.url?.replace(/("|')$/g, ""))
  )
}

contents = prependImport(contents)

await ensureDir(path.dirname(scriptPath))
await writeFile(scriptPath, contents)

await cli("create-bin", "scripts", name)

global.log(
  chalk`\nCreated a {green ${name}} script using the {yellow ${template}} template`
)

await run(kitPath("cli", "edit-script.js"), scriptPath)

export { scriptPath }
