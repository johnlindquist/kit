// Name: Search Docs
// Description: Type to Search Docs

// Log: false
export {}

let docsDir = home(".kit-docs", "docs")

if (await pathExists(docsDir)) {
  let docsFiles = await readdir(docsDir)

  await arg(
    "Docs",
    docsFiles.map(file => ({
      name: file,
      preview: async () => {
        let contents = await readFile(
          kitPath("docs", file),
          "utf-8"
        )

        return global.highlightMd(contents)
      },
    }))
  )
} else {
  await arg({
    placeholder: `Can't find docs dir`,
    hint: `Todo: prompt to clone docs`,
  })
}
