// Description: Download latest hot

try {
  await download(
    `https://www.scriptkit.com/data/hot.json`,
    kitPath("data")
  )
  console.log(`🔥 Hot updated`)
} catch {
  console.warn(`Hot failed to download`)
}

export {}
