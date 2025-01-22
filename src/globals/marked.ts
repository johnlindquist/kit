import { marked as _marked } from "marked"
import { gfmHeadingId } from "marked-gfm-heading-id"
import markedExtendedTables from "marked-extended-tables"
import { markedHighlight } from "marked-highlight"
import hljs from "highlight.js"

const tableRegex = /<\/table>$/

// Configure marked with all required extensions and options
_marked.use(
  gfmHeadingId(),
  markedExtendedTables(),
  markedHighlight({
    langPrefix: 'language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
      return code
    }
  }),
  {
    gfm: true,
    breaks: false,
    pedantic: false,
    silent: false,
    hooks: {
      postprocess(html) {      
        // Fix table formatting
        html = html.replace(/<table>.*?<\/table>/gs, match => {
          return match
            .replace(/><(?!\/)/g, '>\n<')
            .replace(/<\/tr><\/thead>/g, '</tr>\n</thead>')
            .replace(/<\/tr><\/tbody>/g, '</tr>\n</tbody>')
            .replace(/<\/tbody><\/table>/g, '</tbody></table>')
            .replace(/<tbody>\n<tr>/g, '<tbody><tr>')
            .replace(tableRegex, '</table>\n')
        })
        
        return html
      }
    }
  }
)
export let marked = (globalThis.marked = _marked) as typeof _marked

const _md = (markdown: string, containerClasses = "p-5 prose dark:prose-dark"):string => {
  let html = ''
  try{
    html = marked.parse(markdown).toString()
  } catch (e) {
    console.error(`Failed to parse markdown: ${e}`)
  }

  if (containerClasses) {
    return `<div class="${containerClasses}">${html}</div>`
  }
  return html
}

export let md = (globalThis.md = _md) as typeof _md