// Name: New
// Description: Create a new script
// Log: false

import { highlightJavaScript } from "../api/kit.js"

import {
  exists,
  kitMode,
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

let name = await arg(
  {
    placeholder:
      arg?.placeholder || "Enter a name for your script:",
    validate: input => {
      return exists(input.replace(/\s/g, "-").toLowerCase())
    },
    shortcuts: [],
    enter: `Create script and open in editor`,
    strict: false,
  },
  [
    {
      info: true,
      name: `Requirements: lowercase, dashed, no extension`,
      description: `Examples: ${examples}`,
    },
  ]
)

let response = await get(arg?.url)
let content = await response.data

let preview = await highlightJavaScript(content)

if (process?.env?.KIT_TRUST_SCRIPTS !== "true") {
  setName(``)
  let message = await arg(
    {
      enter: "",
      placeholder: `Type "ok" and hit enter to continue...`,
      strict: true,
      height: PROMPT.HEIGHT["4XL"],
      description: `Download ${name}`,
      onInput: async input => {
        if (input === "ok") {
          setEnter(`Download ${name}`)
        } else {
          setEnter(``)
        }
      },
      shortcuts: [
        {
          name: "Cancel",
          key: "escape",
          bar: "left",
          onPress: () => process.exit(),
        },
      ],
    },
    md(`
## Caution: This Action Will Download a Script from the Internet

Running scripts from the internet poses significant risks. Scripts have the ability to:

- Delete, modify, or steal your files
- Watch keystrokes and register key commands
- Start background processes and much more...

## Stripping Metadata Comments

This script will be stripped of metadata before being added to your scripts folder to prevent scripts from running automatically. You will need to manually add back Shortcuts, Snippets, Schedule, etc if you want to re-enable them.

## Review the Script Below

${preview}

## Any Doubts? Ask for Help!

If you are unsure about the safety of this script, please ask the community for help before proceeding:

> [Get Help on GitHub](https://github.com/johnlindquist/kit/discussions/categories/q-a)
>
> [Get Help on Discord](https://discord.gg/qnUX4XqJQd)

## Accept Risks and Proceed with Download

If you understand and accept the risks associated with downloading this script, type "ok" and press "Enter" to continue with the download. 
Hit "escape" to cancel.
  `)
  )

  if (message !== "ok") {
    exit()
  }
}

let { dirPath: selectedKenvPath } = await selectKenv({
  placeholder: `Select Where to Create Script`,
  enter: "Create Script in Selected Kenv",
})

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
contents += templateCompiler({
  ...env,
  ...Object.fromEntries(memoryMap),
  name: arg?.scriptName || name,
})
if (
  (arg?.scriptName || command !== name) &&
  !contents.includes(`Name:`)
) {
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

await cli("create-bin", "scripts", command)

global.log(
  chalk`\nCreated a {green ${name}} script using the {yellow ${template}} template`
)

await run(kitPath("cli", "edit-script.js"), scriptPath)

export { scriptPath }
