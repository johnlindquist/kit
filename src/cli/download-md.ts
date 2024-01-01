let downloadMarkdown = async (fileName: string) => {
  try {
    let url = `https://raw.githubusercontent.com/johnlindquist/kit-docs/main/${fileName}`
    console.log(`Downloading ${url}...`)
    let buffer = await download(url, undefined, {
      rejectUnauthorized: false,
    })
    await writeFile(kitPath(fileName), buffer)
  } catch (error) {
    log(`Error downloading ${fileName}`)
  }
}

await downloadMarkdown("API.md")
await downloadMarkdown("GUIDE.md")
await downloadMarkdown("KIT.md")
await downloadMarkdown("TIPS.md")
await downloadMarkdown("SPONSOR.md")

export {}
