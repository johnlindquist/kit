// Description: Disable Auto Update

await global.cli(
  "set-env-var",
  "KIT_DISABLE_AUTO_UPDATE",
  "true"
)
process.env.KIT_DISABLE_AUTO_UPDATE = "true"
await mainScript()

export {}
