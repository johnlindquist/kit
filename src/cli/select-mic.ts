// Description: Select a Microphone

let devices = await getMediaDevices()

let micId = await arg(
  "Select Mic",
  devices
    .filter(d => d.kind === "audioinput")
    .map(d => {
      return {
        name: d.label,
        value: d.deviceId,
      }
    })
)

await run(
  kitPath("cli", "set-env-var.js"),
  "KIT_MIC",
  micId
)

export {}
