# Div API - Complete Flow Documentation

## Overview

The `div` API displays HTML or Markdown content in a Script Kit prompt window. Unlike interactive prompts like `arg`, `div` is primarily for presenting information, confirmations, or rich content displays with optional action buttons.

## API Signature

```typescript
div(htmlOrConfig: string | DivConfig, actions?: Action[]): Promise<any>
```

### Parameters

- **htmlOrConfig**: Either:
  - **string**: HTML or Markdown content to display
  - **DivConfig**: Configuration object with display options
- **actions**: Optional array of action buttons

### DivConfig Interface

```typescript
interface DivConfig extends PromptConfig {
  html: string                // HTML content to display
  placeholder?: string        // Input placeholder (if input enabled)
  hint?: string              // Hint text
  footer?: string            // Footer content
  containerClasses?: string  // CSS classes for content wrapper
}
```

### Return Value

Returns a Promise that resolves when:
- User clicks "Continue" (default)
- User triggers an action
- User presses Escape (if not prevented)

## Implementation Flow

### 1. SDK Implementation (sdk/src/target/app.ts)

The div function prepares display content:

```typescript
global.div = async (htmlOrConfig = "", actions = []) => {
  // Normalize to config object
  let config: DivConfig = typeof htmlOrConfig === "string"
    ? { html: htmlOrConfig }
    : htmlOrConfig
    
  // Handle empty content
  if (!config.html?.trim()) {
    config.html = md("⚠️ html string was empty")
  }
  
  // Create prompt with div UI
  return await global.kitPrompt({
    enter: 'Continue',
    shortcuts: [escapeShortcut],
    ...config,
    choices: maybeWrapHtml(config.html, config.containerClasses),
    ui: UI.div,
    actions,
  })
}
```

### 2. HTML Wrapping

Content can be wrapped with container classes:

```typescript
let maybeWrapHtml = (html = "", containerClasses = "") => {
  return containerClasses?.length === 0
    ? html
    : `<div class="${containerClasses}">${html}</div>`
}
```

### 3. Message Transport

The div configuration is sent via:
- Channel: `SET_PROMPT_DATA`
- UI Type: `UI.div`
- Content passed as `choices` parameter

### 4. App-Side Rendering

The Electron app:
1. Recognizes `ui: UI.div` type
2. Renders HTML content instead of choice list
3. Shows action buttons if provided
4. Displays "Continue" button by default

## Content Types

### HTML Content
```typescript
await div(`
  <div class="p-4">
    <h1 class="text-2xl font-bold">Welcome!</h1>
    <p class="mt-2">This is a simple HTML display.</p>
  </div>
`)
```

### Markdown Content
```typescript
await div(md(`
# Markdown Example

- Bullet point 1
- Bullet point 2

**Bold text** and *italic text*
`))
```

### Styled with Tailwind
```typescript
await div(`
  <div class="bg-blue-500 text-white p-6 rounded-lg">
    <h2 class="text-xl mb-4">Notification</h2>
    <p>Your task has been completed successfully.</p>
  </div>
`)
```

### With Container Classes
```typescript
await div({
  html: "<h1>Centered Content</h1>",
  containerClasses: "flex items-center justify-center h-full"
})
```

## Platform-Specific Behavior

### Rendering Engine
- Uses Chromium-based rendering (Electron)
- Full HTML5/CSS3 support
- JavaScript execution in content

### Styling
- Tailwind CSS classes available
- Custom CSS via style tags
- Responsive to window size

## Complete Flow Diagram

```
Script              SDK                    IPC                    App                   UI
  |                  |                      |                      |                     |
  |--div(html)------>|                      |                      |                     |
  |                  |--kitPrompt()-------->|                      |                     |
  |                  |  ui: UI.div          |                      |                     |
  |                  |  choices: html       |                      |                     |
  |                  |                      |                      |                     |
  |                  |--SET_PROMPT_DATA---->|                      |                     |
  |                  |                      |--createPrompt()----->|                     |
  |                  |                      |                      |--render HTML------->|
  |                  |                      |                      |                     |
  |                  |                      |                      |<--user clicks-------|
  |                  |                      |<--PROMPT_RESPONSE----|    "Continue"       |
  |                  |<--resolved-----------|                      |                     |
  |<--returns---------|                      |                      |                     |
```

## Important Considerations

### Side Effects
- **Window Display**: Shows prompt window
- **Focus Change**: Takes focus from current app
- **Blocking**: Script waits for user interaction
- **Content Execution**: HTML can include scripts

### Timing and Performance
- **Render Time**: Complex HTML may take time
- **Memory Usage**: Large content impacts memory
- **Animation**: CSS animations supported
- **Updates**: Can update content dynamically

### Security Implications
- **XSS Risk**: Be careful with user-provided content
- **Script Execution**: JavaScript runs in content
- **External Resources**: Can load external assets
- **Sanitization**: Always sanitize untrusted input

### Known Limitations
- **No Direct Input**: Use form/fields for input
- **Single Page**: Can't navigate between pages
- **Size Constraints**: Limited by window size
- **Print Support**: Limited printing capabilities

## Usage Examples

### Simple Message
```typescript
await div(`
  <div class="p-8 text-center">
    <h1 class="text-3xl mb-4">✅ Success!</h1>
    <p>Your operation completed successfully.</p>
  </div>
`)
```

### Information Display
```typescript
const stats = await getSystemStats()
await div(`
  <div class="p-6">
    <h2 class="text-xl mb-4">System Information</h2>
    <dl class="space-y-2">
      <dt class="font-bold">CPU Usage:</dt>
      <dd>${stats.cpu}%</dd>
      <dt class="font-bold">Memory:</dt>
      <dd>${stats.memory}GB / ${stats.totalMemory}GB</dd>
      <dt class="font-bold">Disk:</dt>
      <dd>${stats.disk}GB free</dd>
    </dl>
  </div>
`)
```

### With Actions
```typescript
await div(`
  <div class="p-6">
    <h2 class="text-xl mb-4">Confirm Action</h2>
    <p>Are you sure you want to delete these files?</p>
    <ul class="mt-4 list-disc list-inside">
      <li>document.txt</li>
      <li>image.jpg</li>
    </ul>
  </div>
`, [
  {
    name: "Delete",
    shortcut: "cmd+d",
    onAction: async () => {
      await deleteFiles()
      submit(true)
    }
  },
  {
    name: "Cancel",
    shortcut: "escape",
    onAction: () => submit(false)
  }
])
```

### Loading State
```typescript
await div({
  html: `
    <div class="flex flex-col items-center justify-center p-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p class="mt-4">Processing, please wait...</p>
    </div>
  `,
  enter: "",  // Hide continue button
  onInit: async () => {
    const result = await longRunningOperation()
    submit(result)
  }
})
```

### Progress Display
```typescript
async function showProgress(total: number) {
  for (let i = 0; i <= total; i++) {
    await setDiv(`
      <div class="p-6">
        <h3 class="mb-4">Processing Files</h3>
        <div class="w-full bg-gray-200 rounded-full h-4">
          <div class="bg-blue-500 h-4 rounded-full" style="width: ${(i/total)*100}%"></div>
        </div>
        <p class="mt-2">${i} / ${total} files processed</p>
      </div>
    `)
    await processFile(i)
  }
}
```

### Error Display
```typescript
await div({
  html: `
    <div class="bg-red-50 border-l-4 border-red-500 p-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <span class="text-red-500 text-2xl">⚠️</span>
        </div>
        <div class="ml-3">
          <h3 class="text-red-800 font-medium">Error</h3>
          <p class="text-red-700 mt-1">${error.message}</p>
          <pre class="mt-2 text-sm bg-red-100 p-2 rounded">${error.stack}</pre>
        </div>
      </div>
    </div>
  `,
  enter: "Dismiss"
})
```

## Related APIs

### Complementary APIs
- **arg**: For interactive choices
- **form**: For data input
- **editor**: For text editing
- **md**: For markdown conversion

### Similar Display APIs
- **notify**: System notifications
- **widget**: Floating windows
- **log**: Console output

### When to Use Which
- Use `div` for rich content display
- Use `arg` for user selections
- Use `notify` for brief alerts
- Use `widget` for persistent displays

## Advanced Patterns

### Dynamic Content Updates
```typescript
const divPrompt = div(`<div id="content">Loading...</div>`)

// Update content after initial display
setTimeout(async () => {
  await setDiv(`<div id="content">Content loaded!</div>`)
}, 1000)

await divPrompt
```

### Tabbed Interface
```typescript
await div(`
  <div class="p-4">
    <div class="border-b">
      <button class="px-4 py-2 border-b-2 border-blue-500">Tab 1</button>
      <button class="px-4 py-2">Tab 2</button>
    </div>
    <div class="mt-4">
      <div id="tab1">Tab 1 content</div>
      <div id="tab2" class="hidden">Tab 2 content</div>
    </div>
  </div>
  <script>
    // Tab switching logic
    document.querySelectorAll('button').forEach((btn, i) => {
      btn.onclick = () => {
        document.querySelectorAll('[id^=tab]').forEach(t => t.classList.add('hidden'))
        document.getElementById('tab' + (i+1)).classList.remove('hidden')
      }
    })
  </script>
`)
```

### Form in Div
```typescript
await div({
  html: `
    <form class="p-6 space-y-4" onsubmit="handleSubmit(event)">
      <input type="text" id="name" placeholder="Enter name" 
             class="w-full p-2 border rounded">
      <button type="submit" 
              class="bg-blue-500 text-white px-4 py-2 rounded">
        Submit
      </button>
    </form>
    <script>
      function handleSubmit(e) {
        e.preventDefault()
        const name = document.getElementById('name').value
        window.submit(name)
      }
    </script>
  `,
  enter: ""  // Hide default button
})
```

## Best Practices

1. **Semantic HTML**: Use proper HTML structure
2. **Accessibility**: Include ARIA labels
3. **Error Handling**: Show clear error messages
4. **Loading States**: Indicate async operations
5. **Responsive Design**: Test different window sizes
6. **Content Security**: Sanitize user input
7. **Performance**: Avoid heavy computations

## Debugging Tips

1. **Dev Tools**: Right-click to inspect
2. **Console Logs**: Check renderer console
3. **HTML Validation**: Ensure valid markup
4. **CSS Issues**: Use inspector for styles
5. **Script Errors**: Check for JS errors

## Common Issues

### Content Not Showing
```typescript
// Ensure content is not empty
const content = data || "No data available"
await div(content)
```

### Styling Not Applied
```typescript
// Ensure Tailwind classes are spelled correctly
await div(`
  <div class="p-4">  <!-- Not "padding-4" -->
    Content
  </div>
`)
```

### Actions Not Working
```typescript
// Ensure action handlers are async
await div("Content", [
  {
    name: "Action",
    onAction: async () => {  // Note: async
      await doSomething()
      submit()
    }
  }
])
```


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/(sdk/src/target/app.ts,/workspace/sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.