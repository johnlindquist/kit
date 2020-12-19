//Description: Select a file. Copies a link to your clipboard where others can download the file from your machine.

let { default: ngrok } = await need("ngrok")
let { default: handler } = await need("serve-handler")
let { default: cleanup } = await need("node-cleanup")

import http from "http"
let tmpPath = env.SIMPLE_TMP_PATH
let basePath = cwd()

cd(tmpPath)

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
let symLinkPath = path.join(tmpPath, symLink)

echo(`Creating temporary symlink: ${symLinkPath}`)
ln(filePath, symLinkPath)

let port = 3033

const server = http.createServer(handler)

server.listen(port, async () => {
  let tunnel = await ngrok.connect(port)
  let shareLink = tunnel + "/" + symLink
  echo(chalk.yellow(shareLink) + " copied to clipboard")
  copy(shareLink)
})

cleanup(() => {
  server.close()
  if (test("-f", symLinkPath)) {
    echo(`Removing temporary symlink: ${symLinkPath}`)
    trash(symLinkPath)
  }
})
