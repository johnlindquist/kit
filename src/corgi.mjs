#!js
import download from "image-downloader"

let response = await fetch(
  `https://dog.ceo/api/breed/corgi/images/random`,
  {
    headers: {
      Accept: "text/plain",
    },
  }
)
let { message: url } = await response.json()

let { filename: file } = await download.image({
  url,
  dest: "/Users/johnlindquist/tmp",
})

preview(file)
