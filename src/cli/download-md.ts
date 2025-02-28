let downloadMarkdown = async (fileName: string) => {
  try {
    let url = `https://raw.githubusercontent.com/johnlindquist/kit-docs/main/${fileName}`
    process.send?.(`Downloading ${url}...`)
    let buffer = await download(url, undefined, {
      rejectUnauthorized: false,
    })
    await writeFile(kitPath(fileName), buffer)
    process.send?.(`Successfully downloaded ${fileName}`)
  } catch (error) {
    process.send?.(`Error downloading ${fileName}`)
  }
}

await downloadMarkdown("ANNOUNCEMENTS.md")
await downloadMarkdown("API-GENERATED.md")
await downloadMarkdown("SCRIPTLETS.md")
await downloadMarkdown("GUIDE.md")
await downloadMarkdown("KIT.md")
await downloadMarkdown("TIPS.md")
await downloadMarkdown("SPONSOR.md")

export {}
