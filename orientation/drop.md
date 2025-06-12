# drop API

## Overview

The `drop` API creates a drag-and-drop interface that allows users to drop files, text, or other content into Script Kit. It provides a simple drop zone with customizable placeholder text and actions.

## Function Definition

```typescript
global.drop = async (
  placeholder = "Drop something here...",
  actions?: Action[]
) => {
  let config: Partial<PromptConfig> =
    typeof placeholder === "string"
      ? { placeholder }
      : placeholder

  return await global.kitPrompt({
    ui: UI.drop,
    enter: "",
    actions,
    width: config?.preview
      ? PROMPT.WIDTH.BASE
      : PROMPT.WIDTH.XXS,
    height: PROMPT.WIDTH.XXS,
    shortcuts: [escapeShortcut, closeShortcut],
    ...config,
  })
}
```

## Location
- **SDK Definition**: `/src/target/app.ts` (line 1381)
- **Channel**: Uses standard prompt channels
- **UI Type**: `UI.drop` - Drag and drop interface

## Function Signature

```typescript
drop(placeholder?: string | PromptConfig, actions?: Action[]): Promise<any>
```

## How It Works

1. **Display**: Shows a drop zone with placeholder text
2. **User Interaction**: User drags and drops content onto the zone
3. **Content Detection**: Automatically detects the type of dropped content
4. **Return Value**: Returns information about the dropped item(s)

## Returned Data

The drop API returns different data based on what was dropped:

### For Files
```javascript
{
  files: [
    {
      path: "/path/to/file.txt",
      name: "file.txt",
      type: "text/plain",
      size: 1234
    }
  ]
}
```

### For Text
```javascript
{
  text: "The dropped text content"
}
```

### For URLs
```javascript
{
  url: "https://example.com"
}
```

## Key Features

- **Multiple File Support**: Can handle multiple files dropped at once
- **Type Detection**: Automatically identifies content type
- **Custom Actions**: Add buttons or shortcuts for additional functionality
- **Flexible Sizing**: Adjusts size based on preview needs
- **Clean Interface**: Minimal UI focused on the drop action

## Usage Examples

```javascript
// Basic drop zone
let dropped = await drop()
if (dropped.files) {
  for (let file of dropped.files) {
    console.log(`Dropped: ${file.path}`)
  }
}

// Custom placeholder
let image = await drop("Drop an image here")

// With configuration
let content = await drop({
  placeholder: "Drop files to process",
  preview: md(`## File Processor
  
  Drop one or more files to:
  - Convert format
  - Compress
  - Rename
  `)
})

// With custom actions
let dropped = await drop("Drop files here", [
  {
    name: "Select Files Instead",
    shortcut: "cmd+o",
    onAction: async () => {
      let files = await selectFile({
        multiple: true
      })
      submit({ files })
    }
  }
])

// Process different content types
let content = await drop("Drop anything")
if (content.files) {
  console.log("Files dropped:", content.files.length)
} else if (content.text) {
  console.log("Text dropped:", content.text)
} else if (content.url) {
  console.log("URL dropped:", content.url)
}
```

## Common Use Cases

1. **File Upload**: Accept files for processing
2. **Image Import**: Drop images for manipulation
3. **Text Import**: Quick text/code snippet import
4. **URL Collection**: Gather links by dropping
5. **Batch Processing**: Drop multiple files at once

## Advanced Examples

### File Type Filtering
```javascript
let images = await drop({
  placeholder: "Drop images here",
  onDrop: (event) => {
    let files = Array.from(event.dataTransfer.files)
    let imageFiles = files.filter(f => 
      f.type.startsWith('image/')
    )
    if (imageFiles.length === 0) {
      setPlaceholder("Please drop only image files")
      return false // Reject drop
    }
  }
})
```

### Progress Indicator
```javascript
let files = await drop({
  placeholder: "Drop files to upload",
  preview: md(`## Ready to upload
  
  Supported formats:
  - Images (jpg, png, gif)
  - Documents (pdf, docx)
  - Archives (zip, tar)
  `)
})

// Process files
for (let file of files.files) {
  setStatus(`Uploading ${file.name}...`)
  await uploadFile(file.path)
}
```

### Multi-Step Drop
```javascript
// Step 1: Drop source files
let source = await drop("Drop source files")

// Step 2: Drop destination folder  
let destination = await drop({
  placeholder: "Drop destination folder",
  onlyDirs: true // Hypothetical option
})

// Process
await processFiles(source.files, destination.path)
```

## UI Characteristics

- **Minimal Design**: Clean drop zone with dashed border
- **Visual Feedback**: Changes appearance on drag over
- **Size**: Default XXS size, expands with preview
- **Escape Support**: Can cancel with Escape key

## Notes

- The drop zone accepts any draggable content
- File paths are returned as absolute paths
- Multiple files can be dropped simultaneously
- The UI provides visual feedback during drag operations
- Returns undefined if cancelled
- Works with files, folders, text, and URLs

## Repomix Command

To generate documentation for the drop API implementation:

```bash
cd ~/scriptkit && npx @repomix/cli --include "sdk/src/target/app.ts"
```