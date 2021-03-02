let envTemplate = await readFile(
  kitPath("templates", "env", "template.env"),
  "utf8"
)

envTemplate = compile(envTemplate)
envTemplate = envTemplate({ ...env })

await writeFile(projectPath(".env"), envTemplate)
