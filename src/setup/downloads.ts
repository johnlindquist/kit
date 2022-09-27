// Description: Downloads the latest docs and hot
// This is run by the app.

try {
  await run(kitPath("hot", "download-hot.js"))
  await run(kitPath("emoji", "download-emoji.js"))
  await run(kitPath("cli", "download-md.js"))
  await run(kitPath("setup", "clone-examples.js"))
  await run(kitPath("setup", "clone-sponsors.js"))
} catch {
  console.warn(`Failed to download data`)
}

export {}
