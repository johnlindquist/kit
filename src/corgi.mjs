#!js
import download from "image-downloader"
import os from "os"

let corgiTmpPath = path.join(
  os.tmpdir(),
  "js-shell-scripts",
  "corgi"
)

if (!shell.test("-e", corgiTmpPath)) {
  shell.mkdir("-p", corgiTmpPath)
}

let response = await axios(
  `https://dog.ceo/api/breed/corgi/images/random`
)

let { filename } = await download.image({
  url: response.data.message,
  dest: corgiTmpPath,
})

preview(filename)
