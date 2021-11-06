try {
  await run(kitPath("hot", "download-hot.js"))
  await run(kitPath("help", "download-docs.js"))
} catch {
  console.warn(`Failed to download data`)
}

export {}
