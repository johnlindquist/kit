let detect = await npm("detect-port")

//TODO: Abstract a method for getting data from the app
let { host, port } = await new Promise((res, rej) => {
  let messageHandler = data => {
    if (data.channel === "SERVER") {
      res(data)
      process.off("message", messageHandler)
    }
  }
  process.on("message", messageHandler)

  send("GET_SERVER_STATE")
})

if (host && port) {
  let stopServer = await arg(
    `Running on http://${host}:${port}. Stop?`,
    [
      { name: "No", value: false },
      { name: "Yes", value: true },
    ]
  )

  if (stopServer) {
    send("STOP_SERVER")
  }
} else {
  host = await arg("Set host: e.g., kit.local")
  port = await arg({
    message: "Set port: e.g., 5555",
    validate: async value => {
      let portInt = parseInt(value, 10)
      let openPort = await detect(portInt)
      if (openPort === portInt) {
        return true
      }

      return `${value} unavailable. Try ${openPort}`
    },
  })

  send("START_SERVER", { host, port })

  setPlaceholder(`Starting http://${host}:${port}`)
  await wait(1000)
}
