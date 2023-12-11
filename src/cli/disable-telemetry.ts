// Description: Disable Telemetry

await global.cli(
  "set-env-var",
  "KIT_DISABLE_TELEMETRY",
  "true"
)
process.env.KIT_DISABLE_TELEMETRY = "true"
await mainScript()

export {}
