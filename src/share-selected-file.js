//Description: Select a file. Copies a link to your clipboard where others can download the file from your machine.
//Menu: Share Selected File

let { default: ngrok } = await need("ngrok")
let { default: handler } = await need("serve-handler")
let { default: cleanup } = await need("node-cleanup")

import http from "http"
let tmpPath = env.SIMPLE_TMP_PATH
let basePath = cwd()

cd(tmpPath)

let { getSelectedPath } = await import("./osx/finder.js")

let filePath = await getSelectedPath()

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
