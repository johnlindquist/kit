// Description: Download latest docs

try {
  await download(
    `https://www.scriptkit.com/api/docs`,
    kitPath("data")
  )

  global.log(`📝 Docs updated`)
} catch {
  global.warn(`Docs failed to download`)
}
export {}
