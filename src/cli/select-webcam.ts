// Description: Select Webcam

let devices = await getMediaDevices()

let webcamId = await arg(
  "Select Webcam",
  devices
    .filter(d => d.kind === "videoinput")
    .map(d => {
      return {
        name: d.label,
        value: d.deviceId,
      }
    })
)

await run(
  kitPath("cli", "set-env-var.js"),
  "KIT_WEBCAM",
  webcamId
)

export {}
