let envTemplate = await readFile(
  sdkPath("templates", "env", "template.env"),
  "utf8"
)

envTemplate = compile(envTemplate)
envTemplate = envTemplate({ ...env })

await writeFile(simplePath(".env"), envTemplate)
