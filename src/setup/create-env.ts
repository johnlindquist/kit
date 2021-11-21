let envTemplatePath = kitPath(
  "templates",
  "env",
  "template.env"
)

let envTemplate = await readFile(envTemplatePath, "utf8")

let envTemplateCompiler = compile(envTemplate)
let compiledEnvTemplate = envTemplateCompiler({
  ...process.env,
})

await writeFile(kenvPath(".env"), compiledEnvTemplate)

export { }
