//Description: Selects a file to share uses localtunnel to share
let localtunnel
let handler
try {
  ;({ default: localtunnel } = await import("localtunnel"))
  ;({ default: handler } = await import("serve-handler"))
} catch {
  //experimenting with "autoinstall" and "re-run if missing"
  echo(
    `Automatically installing missing packages ${chalk.yellow(
      "localtunnel, serve-handler"
    )} and re-running.`
  )
  let child = spawn(
    `simple`,
    ["i", "localtunnel", "serve-handler"],
    {
      stdio: "inherit",
    }
  )
  await new Promise(res => child.on("exit", res))
  child = spawn(`WIP-share-file`, [], { stdio: "inherit" })
  await new Promise(res => child.on("exit", res))
  exit()
}

import http from "http"

let tmpDir = path.join(
  process.env.SIMPLE_PATH,
  ".share-file-tmp"
)

echo(
  `Creating a temp dir to expose through a tunnel: ${tmpDir}`
)
mkdir(tmpDir)
cd(tmpDir)

let fileRelativePath = await arg(
  "Select a file to share: ",
  {
    type: "file",
    basePath: process.env.HOME,
  }
)
let filePath = path.join(process.env.HOME, fileRelativePath)
let symLink = _.last(filePath.split(path.sep)).replaceAll(
  " ",
  "-"
)
let symLinkPath = path.join(tmpDir, symLink)

echo(`Symlinking ${symLink} in ${tmpDir}`)
ln(filePath, symLinkPath)

let port = 3033

const server = http.createServer((request, response) => {
  // You pass two more arguments for config and middleware
  // More details here: https://github.com/vercel/serve-handler#options
  return handler(request, response)
})

server.listen(port, async () => {
  let tunnel = await localtunnel({ port })
  let shareLink = tunnel.url + "/" + symLink
  echo(chalk.yellow(shareLink) + " copied to clipboard")
  copy(shareLink)

  tunnel.on("close", () => {
    // tunnels are closed
  })
  // console.log("Running at http://localhost:" + port)
})

process.stdin.resume() //so the program will not close instantly

function exitHandler(options, exitCode) {
  echo(`Clearing out ${tmpDir}`)
  rm("-rf", tmpDir)
  if (options.exit) process.exit()
}

//do something when app is closing
process.on(
  "exit",
  exitHandler.bind(null, { cleanup: true })
)

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }))

// catches "kill pid" (for example: nodemon restart)
process.on(
  "SIGUSR1",
  exitHandler.bind(null, { exit: true })
)
process.on(
  "SIGUSR2",
  exitHandler.bind(null, { exit: true })
)

//catches uncaught exceptions
process.on(
  "uncaughtException",
  exitHandler.bind(null, { exit: true })
)
