// Description: Download latest hot
// Schedule: * * * * *

await download(
  `https://www.scriptkit.com/data/hot.json`,
  kitPath("data")
)

console.log(`🔥 Hot updated`)

export {}
