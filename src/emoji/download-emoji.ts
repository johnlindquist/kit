// Description: Download latest hot

try {
  await download(
    `https://www.scriptkit.com/api/emoji`,
    kitPath("data")
  )
  global.log(`😘 Emoji updated`)
} catch {
  global.warn(`Emoji failed to download`)
}

export {}
