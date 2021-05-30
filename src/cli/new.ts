// Menu: New Script
// Description: Creates a new empty script you can invoke from the terminal
let { exists } = await import("../utils.js")
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

let scriptPath = path.join(
  kenvPath("scripts"),
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
  contents = (await get(arg?.url)).data
}

mkdir("-p", path.dirname(scriptPath))
await writeFile(scriptPath, contents)

await cli("create-bin", "scripts", name)

console.log(
  chalk`\nCreated a {green ${name}} script using the {yellow ${template}} template`
)

edit(scriptPath, kenvPath())

export {}
