// Description: Creates a new empty script you can invoke from the terminal

let { exists } = await import("./scripts.js")

let name = await arg(
  "Enter a name for your script:",
  null,
  exists
)

let scriptPath = path.join(
  env.SIMPLE_SCRIPTS_PATH,
  name + ".js"
)

let contents = [arg?.npm]
  .flatMap(x => x)
  .filter(Boolean)
  .map(npm => `let {} = await npm("${npm}")`)
  .join("\n")

let template =
  arg?.template || (await env("SIMPLE_TEMPLATE"))

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
await simple(
  "cli/create-bin",
  path
    .join(env.SIMPLE_SCRIPTS_PATH, name)
    .replace(".js", "")
)

console.log(
  chalk`\nCreated a {green ${name}} script using the {yellow ${template}} template`
)

edit(scriptPath, env.SIMPLE_PATH)
