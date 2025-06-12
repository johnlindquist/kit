# Arg API - Complete Flow Documentation

## Overview

The `arg` API is Script Kit's fundamental prompt interface for collecting user input. It can display a simple text input, a searchable list of choices, or dynamic content based on user input. It's the building block for most user interactions in Script Kit.

## API Signature

```typescript
arg<T = string>(
  placeholderOrConfig?: string | PromptConfig,
  choicesOrPanel?: Choices<T> | Panel,
  actionsOrPreview?: Action[] | Preview
): Promise<T>
```

### Parameters

- **placeholderOrConfig**: Either:
  - **string**: Placeholder text for the input
  - **PromptConfig**: Full configuration object
- **choicesOrPanel**: Either:
  - **Choices<T>**: Array, function, or null for input options
  - **Panel**: HTML/Markdown content string
- **actionsOrPreview**: Either:
  - **Action[]**: Array of action buttons
  - **Preview**: Preview content configuration

### Return Value

Returns a Promise that resolves to:
- The selected choice's value (if choices provided)
- The typed text (if no choices)
- The result of form/field inputs

## Implementation Flow

### 1. SDK Implementation

The arg function is dynamically assigned based on environment:

```typescript
// In sdk/src/target/app.ts
global.arg = 
  process?.env?.KIT_MAIN_SCRIPT === "v1"
    ? global.basePrompt
    : global.mini
```

By default, `arg` uses `mini` which provides a minimal UI:

```typescript
global.mini = async (placeholderOrConfig, choices, actions) => {
  let config = // ... process parameters
  
  return await global.basePrompt({
    placeholder,
    choices,
    actions,
    footer: false,      // Hide footer
    headerHeight: 0,    // Hide header
    inputHeight: 32,    // Small input
    itemHeight: 32,     // Compact items
    ...config
  })
}
```

### 2. Base Prompt Processing

The `basePrompt` function handles core logic:

```typescript
global.basePrompt = async (placeholderOrConfig, choices, actions) => {
  // Process parameters into config object
  const config = typeof placeholderOrConfig === 'string' 
    ? { placeholder: placeholderOrConfig, choices, actions }
    : placeholderOrConfig
    
  // Set UI type
  config.ui = UI.arg
  
  // Configure based on choices type
  if (typeof choices === 'function') {
    config.mode = Mode.GENERATE  // Dynamic choices
  } else {
    config.mode = Mode.FILTER    // Static filtering
  }
  
  // Call main prompt function
  return await global.kitPrompt(config)
}
```

### 3. Kit Prompt Orchestration

The `kitPrompt` function manages the lifecycle:

```typescript
global.kitPrompt = async (config) => {
  // Check for command-line arguments
  const nextArg = await global.nextArg()
  if (nextArg) return nextArg
  
  // Send prompt configuration to app
  await sendWait(Channel.SET_PROMPT_DATA, config)
  
  // Set up event handlers
  if (config.onInput) {
    global.kitPrompt.onInput = config.onInput
  }
  
  // Wait for user response
  const result = await waitForPromptValue()
  
  return result
}
```

### 4. App-Side Rendering

The Electron app receives the prompt configuration and:
1. Creates or updates the prompt window
2. Renders the appropriate UI based on config
3. Handles user interactions
4. Sends results back via IPC

## Choice Types

### Static Choices
```typescript
// Array of strings
await arg("Select color", ["red", "green", "blue"])

// Array of objects
await arg("Select file", [
  { name: "Document", value: "doc.txt", description: "Text document" },
  { name: "Image", value: "pic.jpg", description: "JPEG image" }
])
```

### Dynamic Choices
```typescript
// Function returning choices based on input
await arg("Search npm packages", async (input) => {
  if (!input) return []
  const packages = await searchNpm(input)
  return packages.map(pkg => ({
    name: pkg.name,
    value: pkg.name,
    description: pkg.description
  }))
})
```

### No Choices (Text Input)
```typescript
// Simple text input
const name = await arg("Enter your name")
```

### Panel Content
```typescript
// HTML panel instead of choices
await arg({
  placeholder: "Confirm action",
  panel: md(`
# Confirmation Required

Are you sure you want to proceed?

- This action cannot be undone
- All data will be permanently deleted
  `)
})
```

## Platform-Specific Behavior

### Focus Management
- **macOS**: Smooth focus transitions
- **Windows**: May require focus workarounds
- **Linux**: Focus behavior varies by window manager

### Rendering
- Uses web technologies (HTML/CSS/JS)
- Consistent appearance across platforms
- Respects system dark/light mode

## Complete Flow Diagram

```
Script              SDK                  IPC                    App                    UI
  |                  |                    |                      |                      |
  |--arg("Pick",--->|                    |                      |                      |
  |   ["A","B"])     |                    |                      |                      |
  |                  |--basePrompt()----->|                      |                      |
  |                  |  mini wrapper      |                      |                      |
  |                  |                    |                      |                      |
  |                  |--kitPrompt()------>|                      |                      |
  |                  |  ui: UI.arg        |                      |                      |
  |                  |                    |                      |                      |
  |                  |--SET_PROMPT_DATA-->|                      |                      |
  |                  |                    |--createPrompt()----->|                      |
  |                  |                    |                      |--render UI---------->|
  |                  |                    |                      |                      |
  |                  |                    |                      |<--user selects "A"---|
  |                  |                    |<--PROMPT_RESPONSE----|                      |
  |                  |<--value: "A"-------|                      |                      |
  |<--"A"------------|                    |                      |                      |
```

## Important Considerations

### Side Effects
- **Window Creation**: Shows prompt window
- **Focus Stealing**: Takes focus from current app
- **Process Blocking**: Script waits for response
- **State Management**: Previous inputs may be cached

### Timing and Performance
- **Instant Display**: Prompt appears immediately
- **Search Debouncing**: Dynamic choices are debounced
- **Memory Usage**: Large choice lists impact memory
- **Caching**: Choices can be preloaded

### Security Implications
- **Input Validation**: Always validate user input
- **HTML Injection**: Panel content should be sanitized
- **Script Execution**: Be careful with dynamic content
- **Sensitive Data**: Avoid showing passwords

### Known Limitations
- **Single Selection**: Can't select multiple items (use form/select)
- **No Pagination**: Large lists can be unwieldy
- **Limited Styling**: Basic customization only
- **Synchronous**: Blocks script execution

## Usage Examples

### Basic Selection
```typescript
// Simple choice
const color = await arg("Pick a color", ["red", "green", "blue"])

// With descriptions
const action = await arg("What would you like to do?", [
  { name: "Create", value: "create", description: "Create a new item" },
  { name: "Edit", value: "edit", description: "Edit existing item" },
  { name: "Delete", value: "delete", description: "Delete an item" }
])
```

### Dynamic Search
```typescript
// File search
const file = await arg("Search files", async (input) => {
  if (!input) return []
  const files = await globby(`**/*${input}*`)
  return files.map(f => ({
    name: path.basename(f),
    value: f,
    description: f
  }))
})
```

### Input Validation
```typescript
// Email validation
const email = await arg({
  placeholder: "Enter email",
  validate: (value) => {
    if (!value.includes('@')) {
      return "Please enter a valid email"
    }
    return true
  }
})
```

### With Actions
```typescript
// Actions for quick operations
const task = await arg("Select task", 
  ["Task 1", "Task 2", "Task 3"],
  [
    {
      name: "Complete All",
      shortcut: "cmd+a",
      onAction: async () => {
        await completeAllTasks()
        exit() // Close prompt
      }
    }
  ]
)
```

### Conditional Choices
```typescript
// Show different options based on context
const mode = await env("MODE")
const choices = mode === "dev" 
  ? ["develop", "test", "debug"]
  : ["deploy", "monitor", "backup"]

const action = await arg("Select action", choices)
```

### With Preview
```typescript
// Show preview of selection
const script = await arg({
  placeholder: "Select script",
  choices: await getScripts(),
  preview: async (choice) => {
    const content = await readFile(choice.value)
    return md(`
## ${choice.name}
\`\`\`javascript
${content}
\`\`\`
    `)
  }
})
```

## Related APIs

### Complementary APIs
- **select**: Multi-select version
- **div**: Display-only content
- **form**: Multiple inputs
- **fields**: Key-value inputs
- **editor**: Text editing

### Specialized Prompts
- **path**: File/folder selection
- **drop**: Drag and drop
- **mic**: Audio input
- **webcam**: Camera input

### When to Use Which
- Use `arg` for single selections or simple input
- Use `select` for multiple selections
- Use `form` for complex data entry
- Use `div` for information display

## Advanced Patterns

### Chained Prompts
```typescript
// Multi-step selection
const category = await arg("Select category", ["Books", "Movies", "Games"])
const items = await getItemsForCategory(category)
const selected = await arg(`Select ${category}`, items)
```

### Cached Choices
```typescript
// Cache expensive operations
let cachedPackages = null

const package = await arg("Search npm packages", async (input) => {
  if (!cachedPackages) {
    cachedPackages = await fetchPopularPackages()
  }
  
  if (!input) return cachedPackages
  
  return cachedPackages.filter(p => 
    p.name.includes(input)
  )
})
```

### Smart Defaults
```typescript
// Remember last selection
const history = await db("selectionHistory", { last: null })
const choices = ["Option A", "Option B", "Option C"]

// Put last selection first
if (history.last) {
  const index = choices.indexOf(history.last)
  if (index > 0) {
    choices.splice(index, 1)
    choices.unshift(history.last)
  }
}

const selected = await arg("Select option", choices)
history.last = selected
await history.write()
```

### Error Handling
```typescript
// Graceful error handling
let result
try {
  result = await arg("Select file", async () => {
    const files = await readdir("./")
    return files
  })
} catch (error) {
  result = await arg("Error loading files. Enter manually:")
}
```

## Best Practices

1. **Clear Placeholders**: Use descriptive placeholder text
2. **Helpful Descriptions**: Add descriptions to choices
3. **Loading States**: Show feedback for async operations
4. **Error Messages**: Handle failures gracefully
5. **Keyboard Shortcuts**: Add shortcuts for common actions
6. **Sensible Defaults**: Pre-select logical defaults
7. **Input Validation**: Validate before processing

## Debugging Tips

1. **Log Choices**: Console.log the choices array
2. **Test Edge Cases**: Empty arrays, long lists
3. **Check Types**: Ensure value types match expectations
4. **Monitor Performance**: Profile dynamic choice functions
5. **Test Cancellation**: Handle user pressing Escape

## Common Issues

### Choices Not Showing
```typescript
// Ensure choices return proper format
const choices = data.map(item => ({
  name: item.title || "Untitled",  // Fallback for missing data
  value: item.id,
  description: item.desc
}))
```

### Dynamic Choices Not Updating
```typescript
// Force fresh data on each keystroke
await arg("Search", async (input) => {
  // Don't cache inside the function
  const results = await fetch(`/search?q=${input}`)
  return results
})
```

### Focus Issues
```typescript
// Ensure prompt gets focus
await wait(100)  // Small delay
const result = await arg("Select option", choices)
```


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.