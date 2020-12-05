#!js

import sharp from "sharp"
import icoToPng from "ico-to-png"
import os from "os"

let iconCachePath = path.join(
  os.tmpdir(),
  "js-shell-scripts",
  "iconCache"
)

if (!test("-e", iconCachePath)) {
  mkdir("-p", iconCachePath)
}

let search = $1
let response = await get(
  `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&q=${search}&fields=items(title,link,displayLink,pagemap/cse_thumbnail/src)`
)
let results = response.data
let items = await Promise.all(
  results.items.map(async item => {
    let iconSrc = item?.pagemap?.cse_thumbnail?.[0]?.src
    let iconPath = path.join(
      iconCachePath,
      item.displayLink + "-icon.jpg"
    )
    if (iconSrc) {
      try {
        await access(iconPath)
      } catch {
        let url = item.displayLink + "/favicon.ico"
        url = url.startsWith("http") ? url : `http://${url}`
        let response
        let buffer
        try {
          response = await get(url, {
            responseType: "arraybuffer",
          })
          buffer = response.data
          buffer = await icoToPng(buffer, 128)
        } catch (error) {
          response = await get(iconSrc, {
            responseType: "arraybuffer",
          })
          buffer = response.data
        }

        try {
          await sharp(buffer)
            .resize(100, 100)
            .toFile(iconPath)
        } catch (error) {
          // console.log({ error })
        }
      }
    }
    let title = item.title
    let subtitle = item.link + " - open in Chrome"
    let arg = item.link

    return {
      title,
      subtitle,
      arg,
      variables: { title, subtitle },
      icon: {
        path: iconPath ? iconPath : "",
      },
    }
  })
)

let out = {
  variables: {
    search,
  },
  items,
}
console.log(JSON.stringify(out))
