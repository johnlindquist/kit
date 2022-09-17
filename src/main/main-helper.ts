import { backToMainShortcut } from "../core/utils.js"

export let convertMarkdownToArg = async (
  fileName: string
) => {
  let fileMarkdown = await readFile(
    kitPath(fileName),
    "utf-8"
  )
  let lexer = new marked.Lexer()
  let nodes = lexer.lex(fileMarkdown)

  let sections = []

  for (let node of nodes) {
    if (node.type === "heading" && node.depth === 1)
      continue
    if (node.type === "heading" && node.depth === 2) {
      sections.push({
        name: node.text,
        raw: `# ${node.text}\n\n`,
      })
    } else if (sections.length) {
      sections[sections.length - 1].raw += node.raw
    }
  }

  let containerClasses =
    "p-5 prose dark:prose-dark prose-sm"

  let choices = sections.map(section => {
    return {
      name: section.name,
      preview: async () =>
        highlight(section.raw, containerClasses),
      value: section.file,
    }
  })

  return async () => {
    await arg(
      {
        placeholder: "Browse API",
        enter: `Suggest Edit`,
        shortcuts: [backToMainShortcut],
        itemHeight: 48,
      },
      choices
    )

    open(
      `https://github.com/johnlindquist/kit/edit/main/${fileName}`
    )
  }
}
