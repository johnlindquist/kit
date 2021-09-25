// Description: Switch to JavaScript Mode

await global.cli("set-env-var", "KIT_MODE", "js")
process.env.KIT_MODE = "js"

export {}
