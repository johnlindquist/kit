/**
 * Description: Displays a random picture of a Corgi using dog.ceo
 * Shortcut: Alt+C
 */
let { default: download } = await need("image-downloader")
let { default: sizeOf } = await need("image-size")

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

let dimensions = await sizeOf(filename)

show(
  `
  <style>
  *{
    margin:0;
    padding:0;
  }
  </style>
  <img style="width: 100vw" src="${filename}" alt="">`,
  dimensions
)
