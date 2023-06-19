/*

# Create a New Script
*/

// Name: New Script
// Description: Create a new script
// Log: false
// Pass: true

import {
  exists,
  kitMode,
  returnOrEnter,
  stripMetadata,
  uniq,
} from "../core/utils.js"
import {
  ensureTemplates,
  prependImport,
} from "./lib/utils.js"
import { generate } from "@johnlindquist/kit-internal/project-name-generator"

let examples = Array.from({ length: 3 })
  .map((_, i) => generate({ words: 2 }).dashed)
  .join(", ")

let stripName = (name: string) =>
  path.parse(name.trim().replace(/\s/g, "-").toLowerCase())
    .name

let name = arg?.pass
  ? stripName(arg?.pass)
  : await arg(
      {
        placeholder:
          arg?.placeholder ||
          "Enter a name for your script:",
        validate: input => {
          return exists(
            input.replace(/\s/g, "-").toLowerCase()
          )
        },
        shortcuts: [],
        enter: `Create script and open in editor`,
        strict: false,
      },
      [
        {
          info: "always",
          name: `Requirements: lowercase, dashed, no extension`,
          description: `Examples: ${examples}`,
        },
      ]
    )

let { dirPath: selectedKenvPath } = await selectKenv({
  placeholder: `Select Where to Create Script`,
  enter: "Create Script in Selected Kenv",
})

if (
  process?.env?.KIT_EDITOR !== "kit" &&
  process?.env?.KIT_CONTEXT === "app"
) {
  await hide()
}
let command = stripName(name)

let scriptPath = path.join(
  selectedKenvPath,
  "scripts",
  `${command}.${kitMode()}`
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
let scriptName = arg?.pass || arg?.scriptName
contents += templateCompiler({
  ...env,
  ...Object.fromEntries(memoryMap),
  name: scriptName,
})
if (
  (scriptName || command !== name) &&
  !contents.includes(`Name:`)
) {
  contents = `// Name: ${scriptName || name || ""}
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

await cli("create-bin", "scripts", command)

global.log(
  chalk`\nCreated a {green ${name}} script using the {yellow ${template}} template`
)

await run(kitPath("cli", "edit-script.js"), scriptPath)

export { scriptPath }
