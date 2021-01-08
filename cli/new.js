// Description: Creates a new empty script you can invoke from the terminal

let validate = async input => {
  let result = exec(`command -v ${input}`, {
    silent: true,
  })

  if (result.stdout) {
    return chalk`{red.bold ${input}} already exists. Please choose another name.`
  }

  return true
}

let name = await arg("Enter a name for your script:", {
  validate,
})

let scriptPath = path.join(
  env.SIMPLE_SCRIPTS_PATH,
  name + ".js"
)

let contents = [arg?.need]
  .flatMap(x => x)
  .filter(Boolean)
  .map(need => `let {} = await need("${need}")`)
  .join("\n")

let template =
  arg?.template || (await env("SIMPLE_TEMPLATE"))

let templateContent = await readFile(
  path.join(env.SIMPLE_PATH, "templates", template + ".js"),
  "utf8"
)

let templateCompiler = compile(templateContent)
contents += templateCompiler({ name, ...env })

if (arg?.url) {
  contents = (await get(arg?.url)).data
}

await writeFile(scriptPath, contents)
await run(
  "cli/create-bin",
  path
    .join(env.SIMPLE_SCRIPTS_PATH, name)
    .replace(".js", "")
)

console.log(
  chalk`\n Created a {green ${name}} script using the {yellow ${template}} template`
)

edit(scriptPath, env.SIMPLE_PATH)
