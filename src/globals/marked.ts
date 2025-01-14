import { marked as _marked } from "marked"
import type { MarkedFunction } from "../types/globals.ts"

export let marked = (global.marked = _marked) as MarkedFunction

export type Md = (markdown: string, containerClasses?: string) => string
export let md: Md = (global.md = (markdown: string, containerClasses = "p-5 prose dark:prose-dark") => {
  let html = _marked.parse(markdown) as string
  if (containerClasses) {
    return `<div class="${containerClasses}">${html}</div>`
  }

  return html
})
