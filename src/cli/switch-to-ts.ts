// Description: Switch to TypeScript Mode

await global.cli("set-env-var", "KIT_MODE", "ts")
process.env.KIT_MODE = "ts"

await copyFile(
  kitPath("templates", "config", "tsconfig.json"),
  kenvPath("tsconfig.json")
)

export {}
