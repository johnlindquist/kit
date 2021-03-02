// Description: Creates a new empty script you can invoke from the terminal

let { exists } = await import("./scripts.js")

let name = await arg({
  message: "Enter a name for your script:",
  validate: exists,
})

let scriptPath = path.join(
  projectPath("scripts"),
  name + ".js"
)

let contents = [arg?.npm]
  .flatMap(x => x)
  .filter(Boolean)
  .map(npm => `let {} = await npm("${npm}")`)
  .join("\n")

let template = arg?.template || (await env("KIT_TEMPLATE"))

let templateContent = await readFile(
  projectPath("templates", template + ".js"),
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

edit(scriptPath, projectPath())
