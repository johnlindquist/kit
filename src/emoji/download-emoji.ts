// Description: Download latest hot

try {
  await download(
    `https://www.scriptkit.com/api/emoji`,
    kitPath("data"),
    {
      // rejectUnauthorized: false - removed for security reasons
    }
  )
  global.log(`😘 Emoji updated`)
} catch {
  global.warn(`Emoji failed to download`)
}

export {}
