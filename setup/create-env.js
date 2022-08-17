let envTemplate = await readFile(
  kitPath("templates", "env", "template.env"),
  "utf8"
)
let envTemplateCompiler = compile(envTemplate)
let compiledEnvTemplate = envTemplateCompiler({
  ...env,
  KIT: env.KIT || kitPath(),
  KENV: env.KENV || kenvPath(),
  KNODE: env.KNODE || knodePath(),
})
await writeFile(kenvPath(".env"), compiledEnvTemplate)
export {}
