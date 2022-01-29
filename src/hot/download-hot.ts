// Description: Download latest hot

try {
  await download(
    `https://www.scriptkit.com/api/hot`,
    kitPath("data")
  )
  global.log(`🔥 Hot updated`)
} catch {
  global.warn(`Hot failed to download`)
}

export {}
