// Description: Creates a new empty script you can invoke from the terminal

let { exists } = await import("./scripts.js")

let name = await arg({
  message: "Enter a name for your script:",
  validate: exists,
})

let scriptPath = path.join(
  simplePath("scripts"),
  name + ".js"
)

let contents = [arg?.npm]
  .flatMap(x => x)
  .filter(Boolean)
  .map(npm => `let {} = await npm("${npm}")`)
  .join("\n")

let templates = await readdir(simplePath("templates"))
let template = await arg(
  "Select a template",
  templates
    .filter(t => t.endsWith(".js"))
    .map(t => t.replace(".js", ""))
)

let templateContent = await readFile(
  simplePath("templates", template + ".js"),
  "utf8"
)

let templateCompiler = compile(templateContent)
contents += templateCompiler({ name, ...env })

if (arg?.url) {
  contents = (await get(arg?.url)).data
}

await writeFile(scriptPath, contents)

await sdk(
  "cli/create-bin",
  simplePath("scripts", name).replace(".js", "")
)

console.log(
  chalk`\nCreated a {green ${name}} script using the {yellow ${template}} template`
)

edit(scriptPath, simplePath())
