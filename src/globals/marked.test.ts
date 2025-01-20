import ava from "ava"
// @ts-ignore
import { marked, md } from "./marked"

ava.before(() => {
  // Set up globals to match the marked.ts environment
  // @ts-ignore
  global.marked = marked
  // @ts-ignore
  global.md = md
})

ava("marked - basic markdown parsing", (t) => {
  const input = "# Hello World"
  const result = marked.parse(input)
  t.is(result, '<h1 id="hello-world">Hello World</h1>\n')
})

ava("marked - code fence with language", (t) => {
  const input = "```typescript\nconst x = 42;\n```"
  const result = marked.parse(input)
  t.snapshot(result)
})

ava("marked - code fence without language", (t) => {
  const input = "```\nplain text\n```"
  const result = marked.parse(input)
  t.is(result, '<pre><code>plain text\n</code></pre>')
})

ava("marked - inline code", (t) => {
  const input = "Use the `console.log()` function"
  const result = marked.parse(input)
  t.is(result, '<p>Use the <code>console.log()</code> function</p>\n')
})

ava("marked - nested lists with code", (t) => {
  const input = `
- Level 1
  - Level 2 with \`code\`
    - Level 3
`.trim()
  const result = marked.parse(input)
  t.is(result, '<ul>\n<li>Level 1<ul>\n<li>Level 2 with <code>code</code><ul>\n<li>Level 3</li>\n</ul>\n</li>\n</ul>\n</li>\n</ul>\n')
})

ava("marked - tables", (t) => {
  const input = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`.trim()
  const result = marked.parse(input)
  t.is(result, '<table>\n<thead>\n<tr>\n<th>Header 1</th>\n<th>Header 2</th>\n</tr>\n</thead>\n<tbody><tr>\n<td>Cell 1</td>\n<td>Cell 2</td>\n</tr>\n</tbody></table>\n')
})

ava("marked - mixed inline styles", (t) => {
  const input = "**Bold** and *italic* and `code` and [link](https://example.com)"
  const result = marked.parse(input)
  t.is(result, '<p><strong>Bold</strong> and <em>italic</em> and <code>code</code> and <a href="https://example.com">link</a></p>\n')
})

ava("md - with default container and complex content", (t) => {
  const input = `
# Title
\`\`\`js
const x = 42;
\`\`\`
`.trim()
  const result = md(input)
  t.snapshot(result)
})

ava("marked - blockquotes with markdown", (t) => {
  const input = "> **Note:** This is a _quoted_ text with `code`"
  const result = marked.parse(input)
  t.is(result, '<blockquote>\n<p><strong>Note:</strong> This is a <em>quoted</em> text with <code>code</code></p>\n</blockquote>\n')
})

ava("marked - html passthrough", (t) => {
  const input = "<div class='custom'>**md** inside html</div>"
  const result = marked.parse(input)
  t.is(result, "<div class='custom'>**md** inside html</div>")
})

ava("marked - escaping characters", (t) => {
  const input = "\\*not italic\\* and \\`not code\\`"
  const result = marked.parse(input)
  t.is(result, "<p>*not italic* and `not code`</p>\n")
})

ava("md - with default container classes", (t) => {
  const input = "# Hello World"
  const result = md(input)
  t.is(result, '<div class="p-5 prose dark:prose-dark"><h1 id="hello-world">Hello World</h1>\n</div>')
})

ava("md - with custom container classes", (t) => {
  const input = "# Hello World"
  const result = md(input, "custom-class")
  t.is(result, '<div class="custom-class"><h1 id="hello-world">Hello World</h1>\n</div>')
})

ava("md - without container classes", (t) => {
  const input = "# Hello World"
  const result = md(input, "")
  t.is(result, '<h1 id="hello-world">Hello World</h1>\n')
})

ava("marked - code fence with empty lines", (t) => {
  const input = "```js\n\nconst x = 42;\n\n```"
  const result = marked.parse(input)
  t.snapshot(result)
})

ava("marked - code fence with spaces before language", (t) => {
  const input = "```   javascript   \nconst x = 42;\n```"
  const result = marked.parse(input)
  t.snapshot(result)
})

ava("marked - nested code fences in blockquotes", (t) => {
  const input = "> Here's some code:\n> ```js\n> const x = 42;\n> ```"
  const result = marked.parse(input)
  t.snapshot(result)
})

ava("marked - code fence with html inside", (t) => {
  const input = "```html\n<div class='test'>\n  <span>content</span>\n</div>\n```"
  const result = marked.parse(input)
  t.snapshot(result)
})

ava("marked - code fence with backticks inside", (t) => {
  const input = "````\n```js\nconst x = 42;\n```\n````"
  const result = marked.parse(input)
  t.snapshot(result)
})

ava("marked - code fence with markdown inside", (t) => {
  const input = "```\n# Not a heading\n**not bold**\n```"
  const result = marked.parse(input)
  t.is(result, '<pre><code># Not a heading\n**not bold**\n</code></pre>')
})

ava("marked - code fence with mixed indentation", (t) => {
  const input = "```js\n  const x = 1;\n    const y = 2;\n\tconst z = 3;\n```"
  const result = marked.parse(input)
  t.snapshot(result)
})

ava("marked - code fence with escaped backticks", (t) => {
  const input = "```\nUse \\`backticks\\` for inline code\n```"
  const result = marked.parse(input)
  t.is(result, '<pre><code>Use \\`backticks\\` for inline code\n</code></pre>')
})

ava("marked - code fence with unicode characters", (t) => {
  const input = "```js\nconst greeting = '你好';\nconsole.log('🚀');\n```"
  const result = marked.parse(input)
  t.snapshot(result)
})

ava("marked - code fence with tabs at line start", (t) => {
  const input = "```js\n\tlet x = 1;\n\t\tlet y = 2;\n```"
  const result = marked.parse(input)
  t.snapshot(result)
}) 