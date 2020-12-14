/**
 * Description: Displays a random picture of a Corgi using dog.ceo
 *
 * Usage:
 * corgi
 */
let { default: download } = await autoInstall(
  "image-downloader"
)

let corgiTmpPath = path.join(
  tempdir(),
  "simple-shell-scripts",
  "corgi"
)

if (!test("-e", corgiTmpPath)) {
  mkdir("-p", corgiTmpPath)
}

let response = await get(
  `https://dog.ceo/api/breed/corgi/images/random`
)

let { filename } = await download.image({
  url: response.data.message,
  dest: corgiTmpPath,
})

preview(filename)
