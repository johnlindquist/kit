import { minimist } from "@johnlindquist/kit-internal/minimist"

let { default: pty } = (await import("node-pty")) as any
let { default: express } = (await import("express")) as any
let { default: expressWs } = (await import(
  "express-ws"
)) as any

let argv = minimist(process.argv.slice(2))
let command = argv?._?.[0]?.trim()

let appBase = express()
let wsInstance = expressWs(appBase)
let { app } = wsInstance

let port: string | number = ``
let socketURL = ``

let t = pty.spawn(
  process?.env?.KIT_SHELL ||
    (process.platform === "win32" ? "cmd.exe" : "zsh"),
  [],
  {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
  }
)

if (command) t.write(command + "\n")

app.ws("/terminals/:pid", function (ws, req) {
  console.log("Connected to terminal " + t.pid)

  // string message buffering
  function buffer(socket, timeout) {
    let s = ""
    let sender = null
    return data => {
      s += data
      if (!sender) {
        sender = setTimeout(() => {
          socket.send(s)
          s = ""
          sender = null
        }, timeout)
      }
    }
  }
  // binary message buffering
  function bufferUtf8(socket, timeout) {
    let buffer = []
    let sender = null
    let length = 0
    return data => {
      if (typeof data === "string")
        data = Buffer.from(data, "utf8")
      buffer.push(data)

      process.send({
        data: data.toString("utf8"),
        port,
        socketURL,
      })

      length += data.length
      if (!sender) {
        sender = setTimeout(() => {
          socket.send(Buffer.concat(buffer, length))
          buffer = []
          sender = null
          length = 0
        }, timeout)
      }
    }
  }
  const sendData =
    process.platform !== "win32"
      ? bufferUtf8(ws, 5)
      : buffer(ws, 5)

  t.onData(data => {
    try {
      sendData(data)
    } catch (ex) {
      // The WebSocket is not open, ignore
    }
  })

  t.onExit(() => {
    ws.close()
    if (t) t.kill()
    t = null
  })
  ws.on("message", function (msg: string) {
    t.write(msg)
  })
  ws.on("close", function () {
    if (t) t.kill()
    t = null
    // console.log("Closed terminal " + t.pid)
    // Clean things up
  })
})

let { default: getPort } = (await import("get-port")) as any

port = process.env.PORT || (await getPort({ port: 3131 }))

let host =
  process.platform === "win32" ? "127.0.0.1" : "0.0.0.0"

socketURL = `ws://${host}:${port}`
console.log(`👂 Listening on ${socketURL}`)
app.listen(port)

process.send({
  port,
  socketURL,
  data: ``,
})

export {}
