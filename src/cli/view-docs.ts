// Menu: Search Docs
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

        let { default: hljs } = await import("highlight.js")

        global.marked.setOptions({
          renderer: new global.marked.Renderer(),
          highlight: function (code, lang) {
            const language = hljs.getLanguage(lang)
              ? lang
              : "plaintext"
            return hljs.highlight(code, { language }).value
          },
          langPrefix: "hljs language-", // highlight.js css expects a top-level 'hljs' class.
          pedantic: false,
          gfm: true,
          breaks: false,
          sanitize: false,
          smartLists: true,
          smartypants: false,
          xhtml: false,
        })

        return global.marked(contents)
      },
    }))
  )
} else {
  await arg({
    placeholder: `Can't find docs dir`,
    hint: `Todo: prompt to clone docs`,
  })
}
