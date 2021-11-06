// Description: Download latest docs

try {
  await download(
    `https://www.scriptkit.com/data/docs.json`,
    kitPath("data")
  )

  console.log(`📝 Docs updated`)
} catch {
  console.warn(`Docs failed to download`)
}
export {}
