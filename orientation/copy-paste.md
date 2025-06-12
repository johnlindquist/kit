# Copy/Paste API - Script Kit Orientation

## Overview

The `copy` and `paste` APIs provide simple clipboard operations for text. These are convenience wrappers around the more comprehensive `clipboard` API, designed for quick text clipboard interactions.

## Implementation Location

Both functions are defined in `/workspace/sdk/src/api/packages/clipboardy.ts`:
- `copy`: Line 4
- `paste`: Line 3

## Function Signatures

```typescript
global.copy = (text: string) => Promise<void>
global.paste = () => Promise<string>
```

## Key Components

### Copy Function
- **Parameter**: `text` - The string to copy to clipboard
- **Return**: Promise that resolves when text is copied

### Paste Function  
- **Parameters**: None
- **Return**: Promise that resolves with clipboard text content

## How It Works

Both functions use Script Kit's channel system to communicate with the main process:
- `copy`: Sends text via `Channel.COPY`
- `paste`: Requests text via `Channel.PASTE`

## Usage Examples

### Basic Copy/Paste
```typescript
// Copy text to clipboard
await copy("Hello, Script Kit!")

// Paste text from clipboard
let text = await paste()
console.log(text) // "Hello, Script Kit!"
```

### Copy Generated Content
```typescript
// Generate and copy a UUID
import { v4 as uuid } from "uuid"
let id = uuid()
await copy(id)
await notify(`Copied UUID: ${id}`)
```

### Transform Clipboard Content
```typescript
// Get clipboard content, transform it, copy back
let original = await paste()
let transformed = original.toUpperCase()
await copy(transformed)
await notify("Transformed clipboard to uppercase!")
```

### Copy From User Input
```typescript
// Get user input and copy it
let userText = await arg("Enter text to copy:")
await copy(userText)
await notify("Copied to clipboard!")
```

### Clipboard Templates
```typescript
// Copy formatted templates
let name = await arg("Enter your name:")
let email = await arg("Enter your email:")

let signature = `
Best regards,
${name}
${email}
`.trim()

await copy(signature)
await notify("Email signature copied!")
```

### Copy File Contents
```typescript
// Read file and copy contents
let filePath = await selectFile()
let content = await readFile(filePath, 'utf8')
await copy(content)
await notify(`Copied contents of ${path.basename(filePath)}`)
```

### Paste and Process
```typescript
// Paste and parse JSON
try {
  let clipboardText = await paste()
  let data = JSON.parse(clipboardText)
  await div(md(`# Parsed JSON
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`
  `))
} catch (error) {
  await notify("Clipboard doesn't contain valid JSON")
}
```

### Copy Multiple Items
```typescript
// Copy multiple items with separators
let items = await arg("Enter items (comma-separated):")
let itemList = items.split(",").map(item => item.trim())
let formatted = itemList.map((item, i) => `${i + 1}. ${item}`).join("\n")
await copy(formatted)
await notify(`Copied ${itemList.length} items as a list`)
```

### Clipboard History Integration
```typescript
// Copy and verify in history
let importantText = "Important data to save"
await copy(importantText)

// Verify it's in clipboard history
let history = await getClipboardHistory()
let found = history.find(item => item.value === importantText)
if (found) {
  console.log("Text successfully added to clipboard history")
}
```

### Copy with Formatting
```typescript
// Copy markdown as plain text
let markdown = `# Title
- Item 1
- Item 2

**Bold text**`

// Strip markdown formatting
let plainText = markdown
  .replace(/#{1,6}\s/g, '')
  .replace(/\*\*/g, '')
  .replace(/^-\s/gm, '• ')

await copy(plainText)
```

## Advanced Clipboard Operations

For more advanced clipboard operations, use the full `clipboard` API:

```typescript
// Copy HTML
await clipboard.writeHTML("<h1>Hello</h1>")

// Copy image
let imageBuffer = await readFile("image.png")
await clipboard.writeImage(imageBuffer)

// Copy RTF
await clipboard.writeRTF("{\\rtf1 Hello}")

// Read different formats
let html = await clipboard.readHTML()
let rtf = await clipboard.readRTF()
```

## Common Patterns

### Copy with Confirmation
```typescript
async function copyWithConfirmation(text) {
  await copy(text)
  await toast("Copied to clipboard!", {
    autoClose: 2000
  })
}
```

### Safe Paste
```typescript
async function safePaste(defaultValue = "") {
  try {
    return await paste()
  } catch (error) {
    console.error("Failed to paste:", error)
    return defaultValue
  }
}
```

### Copy Selection
```typescript
// Copy currently selected text
let selected = await getSelectedText()
if (selected) {
  await copy(selected)
  await notify("Copied selection")
} else {
  await notify("No text selected")
}
```

## Best Practices

1. **Error Handling**: Handle paste failures gracefully
2. **User Feedback**: Confirm successful copy operations
3. **Content Validation**: Validate pasted content before using
4. **Privacy**: Be mindful of sensitive data in clipboard
5. **Format Awareness**: Use appropriate clipboard API for non-text content

## Related APIs

- `clipboard`: Full clipboard API with multiple format support
- `getClipboardHistory()`: Access clipboard history
- `clearClipboardHistory()`: Clear clipboard history
- `getSelectedText()`: Get currently selected text
- `setSelectedText()`: Replace selected text

## Common Use Cases

1. **Text Templates**: Copy frequently used text snippets
2. **Data Transform**: Transform and copy back to clipboard
3. **Code Generation**: Generate and copy code snippets
4. **URL Shortening**: Copy shortened URLs
5. **Format Conversion**: Convert between formats
6. **Quick Notes**: Copy notes or reminders

## Limitations

- Only handles plain text (use `clipboard` API for other formats)
- No direct access to clipboard metadata
- System clipboard permissions may affect functionality


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/api/packages/clipboardy.ts"
```

This will generate a comprehensive report of all the implementation files for this API.