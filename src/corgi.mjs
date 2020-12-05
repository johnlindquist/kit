#!js
import download from "image-downloader"

let corgiTmpPath = path.join(
  TMP_DIR,
  "js-shell-scripts",
  "corgi"
)

if (!test("-e", corgiTmpPath)) {
  mkdir("-p", corgiTmpPath)
}

let response = await axios(
  `https://dog.ceo/api/breed/corgi/images/random`
)

let { filename } = await download.image({
  url: response.data.message,
  dest: corgiTmpPath,
})

preview(filename)
