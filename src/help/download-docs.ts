// Description: Download latest docs

try {
  await download(
    `https://github.com/johnlindquist/kit-docs/releases/latest/download/docs.json`,
    kitPath("data")
  )

  console.log(`📝 Docs updated`)
} catch {
  console.warn(`Docs failed to download`)
}
export {}
