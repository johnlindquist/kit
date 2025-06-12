# md API Orientation

## Overview

The `md` API converts markdown text to HTML with syntax highlighting and formatting. It's the primary way to render formatted text in Script Kit's visual prompts.

## Core Concepts

### Basic Usage
```javascript
// Convert markdown to HTML
let html = md(`# Hello World`)
// Returns: <div class="p-5 prose dark:prose-dark"><h1 id="hello-world">Hello World</h1></div>

// Use with div() to display
await div(md(`
# Welcome
This is **bold** and this is *italic*
`))
```

### Container Classes
```javascript
// Default styling (with padding and prose classes)
md("# Title")

// Custom container classes
md("# Title", "p-10 bg-white text-black")

// No container classes
md("# Title", "")
```

## Features

### 1. **GitHub Flavored Markdown**
```javascript
// Tables
await div(md(`
| Name | Role |
|------|------|
| John | Developer |
| Jane | Designer |
`))

// Task lists
await div(md(`
- [x] Complete task
- [ ] Pending task
`))
```

### 2. **Syntax Highlighting**
```javascript
await div(md(`
\`\`\`javascript
function hello(name) {
  return \`Hello, \${name}!\`
}
\`\`\`
`))
```

### 3. **Submit Links**
```javascript
// Create clickable links that submit values
let choice = await div(md(`
# Select an Option
- [Option A](submit:optionA)
- [Option B](submit:optionB)
- [Option C](submit:optionC)
`))
// choice will be "optionA", "optionB", or "optionC"
```

### 4. **Extended Tables**
```javascript
await div(md(`
| Feature | Status | Notes |
|---------|--------|-------|
| API | ✅ | Complete |
| Docs | 🚧 | In Progress |
| Tests | ❌ | TODO |
`))
```

## Common Patterns

### 1. **Documentation Display**
```javascript
let readme = await readFile("README.md", "utf-8")
await div(md(readme))
```

### 2. **Rich Choice Previews**
```javascript
let files = await readdir("./")
let choice = await arg("Select a file", files.map(file => ({
  name: file,
  preview: () => md(`
# ${file}
- Size: ${statSync(file).size} bytes
- Modified: ${statSync(file).mtime}
  `)
})))
```

### 3. **Interactive Menus**
```javascript
await div(md(`
# Main Menu

## File Operations
- [Create New File](submit:create)
- [Open Existing](submit:open)
- [Delete File](submit:delete)

## Settings
- [Preferences](submit:prefs)
- [About](submit:about)
`))
```

### 4. **Status Messages**
```javascript
// Success message
await div(md(`
# ✅ Success!
Your operation completed successfully.

**Details:**
- Files processed: 10
- Time taken: 2.5s
`), "bg-green-50 dark:bg-green-900")

// Error message
await div(md(`
# ❌ Error
Something went wrong.

\`\`\`
${error.message}
\`\`\`
`), "bg-red-50 dark:bg-red-900")
```

## Integration with Other APIs

### With div()
```javascript
// Most common usage
await div(md("# Hello"))
```

### With arg() Previews
```javascript
await arg({
  placeholder: "Select option",
  preview: () => md(`
# Option Details
Current selection provides...
  `)
})
```

### With setPanel()
```javascript
setPanel(md(`
# Side Panel
Additional information...
`))
```

## Technical Details

- Uses [marked](https://marked.js.org/) library under the hood
- Supports GitHub Flavored Markdown (GFM)
- Includes syntax highlighting via [highlight.js](https://highlightjs.org/)
- Automatically wraps content in a styled container div
- Dark mode support with Tailwind prose classes

## Error Handling

```javascript
// md() safely handles errors
let result = md(null) // Returns empty div
let result2 = md(undefined) // Returns empty div
let result3 = md({}) // Converts to string first
```

## Related APIs

- **div()** - Display HTML content (often used with md())
- **editor()** - Edit markdown content
- **template()** - For structured text templates

## Repomix Command

To generate documentation for the md API implementation:

```bash
cd ~/scriptkit && npx @repomix/cli --include "sdk/src/api/kit.ts"
```