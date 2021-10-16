// Description: Switch to TypeScript Mode

await global.cli("set-env-var", "KIT_MODE", "ts")
process.env.KIT_MODE = "ts"

let tsConfigPath = kenvPath("tsconfig.json")
let tsConfigExists = await pathExists(tsConfigPath)
let tsDefaultTemplatePath = kenvPath(
  "templates",
  "default.ts"
)
let tsDefaultTemplateExists = await pathExists(
  tsDefaultTemplatePath
)

if (!tsConfigExists) {
  await copyFile(
    kitPath("templates", "config", "tsconfig.json"),
    tsConfigPath
  )
}

if (!tsDefaultTemplateExists) {
  await copyFile(
    kitPath("templates", "scripts", "default.ts"),
    tsDefaultTemplatePath
  )
}

export {}
