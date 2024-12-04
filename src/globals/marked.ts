import { marked as _marked } from "marked"

export let marked = (global.marked = _marked)

export type Md = (markdown: string, containerClasses?: string) => string
export let md: Md = (global.md = (markdown: string, containerClasses = "p-5 prose dark:prose-dark") => {
  let html = _marked.parse(markdown) as string
  if (containerClasses) {
    return `<div class="${containerClasses}">${html}</div>`
  }

  return html
})
