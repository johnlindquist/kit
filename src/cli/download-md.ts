let downloadMarkdown = async (fileName: string) => {
  try {
    let buffer = await download(
      `https://raw.githubusercontent.com/johnlindquist/kit-docs/main/${fileName}`,
      undefined,
      {
        rejectUnauthorized: false,
      }
    )
    await writeFile(kitPath(fileName), buffer)
  } catch (error) {
    log(`Error downloading ${fileName}`)
  }
}

await downloadMarkdown("API.md")
await downloadMarkdown("GUIDE.md")
await downloadMarkdown("KIT.md")
await downloadMarkdown("TIPS.md")

export {}
