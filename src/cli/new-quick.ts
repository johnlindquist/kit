// Name: New Script
// Description: Creates a new script
import { generate } from "@johnlindquist/kit-internal/project-name-generator"

let name = "quick-" + generate({ words: 2 }).dashed

let scriptPath = path.join(
  kenvPath(),
  "scripts",
  name + ".js"
)

let contents = [arg?.npm]
  .flatMap(x => x)
  .filter(Boolean)
  .map(npm => `let {} = await npm("${npm}")`)
  .join("\n")

let template = arg?.template || (await env("KIT_TEMPLATE"))

let templateContent = await readFile(
  kenvPath("templates", template + ".js"),
  "utf8"
)

let templateCompiler = compile(templateContent)
contents += templateCompiler({ name, ...env })

if (arg?.url) {
  contents = (await get<string>(arg?.url)).data
}

await ensureDir(path.dirname(scriptPath))
await writeFile(scriptPath, contents)

await cli("create-bin", "scripts", name)

global.log(
  chalk`\nCreated a {green ${name}} script using the {yellow ${template}} template`
)

await edit(scriptPath, kenvPath())

export {}
