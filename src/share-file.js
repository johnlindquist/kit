//Description: Select a file. Copies a link to your clipboard where others can download the file from your machine.

let { default: ngrok } = await need("ngrok")
let { default: handler } = await need("serve-handler")
import http from "http"
let tmpDir = env.SIMPLE_TEMP_DIR
let basePath = process.cwd()

cd(tmpDir)

let fileRelativePath = await arg(
  "Select a file to share: ",
  {
    type: "file",
    basePath,
  }
)

let filePath
if (!fileRelativePath.startsWith(path.sep)) {
  filePath = path.join(basePath, fileRelativePath)
} else {
  filePath = fileRelativePath
}

let symLink = _.last(filePath.split(path.sep)).replaceAll(
  " ",
  "-"
)
let symLinkPath = path.join(tmpDir, symLink)

echo(`Creating temporary symlink: ${symLinkPath}`)
ln(filePath, symLinkPath)

let port = 3033

const server = http.createServer((request, response) => {
  // You pass two more arguments for config and middleware
  // More details here: https://github.com/vercel/serve-handler#options
  return handler(request, response)
})

server.listen(port, async () => {
  let tunnel = await ngrok.connect(port)
  let shareLink = tunnel + "/" + symLink
  echo(chalk.yellow(shareLink) + " copied to clipboard")
  copy(shareLink)
})

process.stdin.resume() //so the program will not close instantly

function exitHandler(options, exitCode) {
  if (test("-f", symLinkPath)) {
    echo(`Removing temporary symlink: ${symLinkPath}`)

    rm(symLinkPath)
  }
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
