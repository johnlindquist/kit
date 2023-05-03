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
      info: "always",
      name: `Requirements: lowercase, dashed, no extension`,
      description: `Examples: ${examples}`,
    },
  ]
)

if (process?.env?.KIT_TRUST_SCRIPTS !== "true") {
  setName(``)
  let message = await arg(
    {
      placeholder: `Type "ok" and hit enter to continue...`,
      strict: true,
      height: PROMPT.HEIGHT["2XL"],
      description: `Download ${name}`,
      shortcuts: [
        {
          name: "Cancel",
          key: "escape",
          bar: "right",
          onPress: () => process.exit(),
        },
      ],
      enter: `Download ${name}`,
    },
    md(`
## Caution: This Action Will Download a Script from the Internet

> Before proceeding, please review the script here: [${arg?.url}](${arg?.url})

Running scripts from the internet poses significant risks. Scripts have the ability to:

- Delete your files
- Transmit your files to a remote server
- Carry out a wide variety of malicious actions

## Any Doubts? Ask for Help!

If you are unsure about the safety of this script, please ask the community for help before proceeding:

> [Get Help on GitHub](https://github.com/johnlindquist/kit/discussions/categories/q-a)
>
> [Get Help on Discord](https://discord.gg/8nRPzK9t)

## Acknowledge Risks and Proceed with Download

If you understand and accept the risks associated with downloading this script, type "ok" and press "Enter" to continue with the download. 
Hit "escape" to cancel.
  `)
  )

  if (message !== "ok") {
    process.exit()
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
