// Description: Downloads the latest docs and hot
// This is run by the app.

try {
  await ensureDir(kitPath("data"))
  await run(kitPath("hot", "download-hot.js"))
  await run(kitPath("emoji", "download-emoji.js"))
  if (!arg.dev) await run(kitPath("cli", "download-md.js"))
  if (!arg.dev) {
    await run(kitPath("setup", "update-examples.js"))
  }
  await run(kitPath("setup", "clone-sponsors.js"))
  let response = await get(
    `https://scriptkit.com/api/get-sponsor-url`
  )
  if (response.data) {
    await writeFile(
      kitPath("data", "sponsor-url.txt"),
      response.data
    )
  }
} catch {
  console.warn(`Failed to download data`)
}

export {}
