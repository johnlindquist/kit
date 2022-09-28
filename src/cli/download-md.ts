let downloadMarkdown = async (fileName: string) => {
  let buffer = await download(
    `https://raw.githubusercontent.com/johnlindquist/kit/main/${fileName}`
  )
  await writeFile(kitPath(fileName), buffer)
}

await downloadMarkdown("API.md")
await downloadMarkdown("GUIDE.md")
await downloadMarkdown("KIT.md")

export {}
