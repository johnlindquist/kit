# Hide/Show API - Script Kit Orientation

## Overview

The `hide` and `show` APIs control the visibility of the Script Kit prompt window. These functions are essential for managing the user interface flow, especially when working with background tasks, widgets, or when you need to temporarily dismiss the prompt.

## Implementation Location

Both functions are defined in `/workspace/sdk/src/target/app.ts`:
- `show`: Used via global reference
- `hide`: Used via global reference

## Function Signatures

```typescript
global.show = async () => Promise<void>
global.hide = async (hideOptions?: HideOptions) => Promise<void>
```

## Key Components

### HideOptions Interface
```typescript
interface HideOptions {
  preloadScript?: string  // Script to preload when hidden
}
```

### Return Values
Both functions return a Promise that resolves when the action is complete.

## How It Works

1. **Window Management**: Controls the Electron window visibility
2. **State Preservation**: Maintains prompt state when hidden
3. **Focus Management**: Handles focus when showing/hiding
4. **Event Handling**: Triggers appropriate lifecycle events

## Usage Examples

### Basic Show/Hide
```typescript
// Hide the prompt
await hide()

// Do some background work
await wait(2000)

// Show the prompt again
await show()
```

### Hide During Background Operations
```typescript
// Hide prompt while performing background tasks
await hide()

try {
  // Long-running operation
  let results = await fetchDataFromAPI()
  await processData(results)
  
  // Show prompt with results
  await show()
  await div(md(`# Processing Complete!`))
} catch (error) {
  await show()
  await div(md(`# Error: ${error.message}`))
}
```

### Working with Widgets
```typescript
// Hide main prompt when showing a widget
let widget = await widget(`
  <h1>Widget Interface</h1>
  <button onclick="sendMessage('close')">Close</button>
`)

// Main prompt is automatically hidden
// Show it again when widget closes
widget.onClose(async () => {
  await show()
  await arg("Widget closed. What next?")
})
```

### Conditional Visibility
```typescript
let mode = await arg("Choose mode", ["Interactive", "Background"])

if (mode === "Background") {
  await hide()
  
  // Run in background
  for (let i = 0; i < 10; i++) {
    await performTask(i)
    await wait(1000)
  }
  
  await notify("Background tasks complete!")
} else {
  // Keep visible for interactive mode
  let result = await arg("Enter value:")
  await div(md(`You entered: ${result}`))
}
```

### With Preload Script
```typescript
// Hide with a preload script
await hide({
  preloadScript: kitPath("scripts", "background-monitor.js")
})

// The preload script runs while hidden
// Useful for setting up watchers or monitors
```

### Toggle Visibility Pattern
```typescript
// Create a toggle function
let isVisible = true

let togglePrompt = async () => {
  if (isVisible) {
    await hide()
    isVisible = false
  } else {
    await show()
    isVisible = true
  }
}

// Use with global shortcut
registerShortcut("cmd+shift+k", togglePrompt)
```

### Focus Management
```typescript
// Show and immediately focus
await show()
await focus()

// Or hide and return focus to previous app
await hide()
await blur()
```

### Progress Monitoring
```typescript
// Hide during file processing
let files = await getFiles()
await hide()

for (let i = 0; i < files.length; i++) {
  await processFile(files[i])
  
  // Update system tray with progress
  await setStatus({
    status: "busy",
    message: `Processing ${i + 1}/${files.length}`
  })
}

await show()
await div(md(`# Processed ${files.length} files!`))
```

## Common Patterns

### Show/Hide with Cleanup
```typescript
try {
  await hide()
  // Background work
} finally {
  // Always show again, even on error
  await show()
}
```

### Delayed Show
```typescript
await hide()
setTimeout(async () => {
  await show()
  await notify("Script Kit is ready!")
}, 5000)
```

### Conditional Hide
```typescript
let silent = await env("SILENT_MODE", "false")
if (silent === "true") {
  await hide()
}
```

## Best Practices

1. **Always Pair**: If you hide, ensure show is called eventually
2. **Error Handling**: Use try/finally to ensure visibility on errors
3. **User Feedback**: Provide feedback when running hidden (notifications, status)
4. **State Management**: Save state before hiding if needed
5. **Focus Control**: Consider focus behavior when showing

## Related APIs

- `blur()`: Remove focus from Script Kit
- `focus()`: Give focus to Script Kit
- `widget()`: Create widgets (auto-hides main prompt)
- `notify()`: Send notifications while hidden
- `setStatus()`: Update menu bar status while hidden

## Common Use Cases

1. **Background Processing**: Hide during long operations
2. **Widget Display**: Hide main prompt when showing widgets
3. **System Integration**: Hide when running as background service
4. **User Preference**: Allow users to minimize/restore
5. **Multi-step Workflows**: Hide between workflow steps


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.