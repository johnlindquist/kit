// Description: Download latest docs

await download(
  `https://www.scriptkit.com/data/docs.json`,
  kitPath("data")
)

console.log(`📝 Docs updated`)

export {}
