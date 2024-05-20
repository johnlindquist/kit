import {
  checkIfCommandExists,
  stripName,
  kitMode,
  stripMetadata,
  uniq,
  keywordInputTransformer,
} from "../core/utils.js"
import {
  ensureTemplates,
  prependImport,
} from "./lib/utils.js"
import { getUserDefaultMetadataMode } from "./metadata-mode.js"
import { getEnvVar } from "../api/kit.js"

let inputTransformer = keywordInputTransformer(arg?.keyword)

let choices = input => [
  {
    info: true,
    name: !input
      ? `Enter a name for your script's metadata`
      : `Name: ${inputTransformer(input)}`,
    description: !input
      ? `The filename will be converted automatically.`
      : `Filename will be converted to ${stripName(
          inputTransformer(input)
        )}.${kitMode()}`,
  },
]

let initialChoices = choices(arg?.keyword)

let name = arg?.pass
  ? stripName(arg?.pass)
  : await arg(
      {
        debounceInput: 0,
        placeholder: arg?.placeholder || "Enter a name",
        validate: input => {
          return checkIfCommandExists(stripName(input))
        },
        shortcuts: [],
        enter: `Create script and open in editor`,
        strict: false,
        initialChoices,
      },
      choices
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
name = inputTransformer(name)
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

if (arg?.tip) {
  contents = arg?.tip
}

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

if (!arg?.tip) {
  contents += templateCompiler({
    ...env,
    ...Object.fromEntries(memoryMap),
    name: scriptName,
  })
}

if (arg?.url || arg?.content) {
  contents = (await get<any>(arg?.url)).data
  if (!arg?.keepMetadata) {
    // TODO(josxa): This should also work with conventions
    contents = stripMetadata(contents, [
      "Menu",
      "Name",
      "Author",
      "Twitter",
      "Alias",
      "Description",
    ])
  }
} else {
  const nameMetadata = scriptName || name || ""

  const defaultMetadataMode = await getUserDefaultMetadataMode()

  if (defaultMetadataMode === 'comment') {
    if (
      (scriptName || command !== name) &&
      !contents.includes(`Name:`)
    ) {
      contents = `// Name: ${nameMetadata}
${contents.startsWith("/") ? contents : "\n" + contents}
`
    }
  } else if (defaultMetadataMode === 'convention') {
    const parts = []

    if (await getEnvVar("KIT_MODE", "ts") === "ts") {
      // Direct type annotation
      parts.push('export const metadata: Metadata = {')
    } else {
      // JSDoc type comment
      parts.push('/** @type Metadata */')
      parts.push('export const metadata = {')
    }

    parts.push(`  name: "${nameMetadata}",`)
    parts.push('}\n')
    parts.push(contents)

    contents = prependImport(parts.join('\n'), { force: true })
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
