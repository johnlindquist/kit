# Clipboard API Documentation

## Overview
The clipboard API provides comprehensive access to the system clipboard, supporting multiple formats including text, HTML, images, RTF, and custom data types. It also includes simple helper functions for basic copy/paste operations.

## API Structure

### Main Clipboard Object
```typescript
global.clipboard = {
  // Read methods
  readText(): Promise<string>
  readHTML(): Promise<string>
  readImage(): Promise<Buffer>
  readRTF(): Promise<string>
  readBookmark(): Promise<{ title: string; url: string }>
  readFindText(): Promise<string>
  
  // Write methods
  writeText(text: string): Promise<void>
  writeHTML(html: string): Promise<void>
  writeImage(image: Buffer): Promise<void>
  writeRTF(rtf: string): Promise<void>
  writeBookmark(bookmark: { url: string; title: string }): Promise<void>
  writeFindText(findText: string): Promise<void>
  writeBuffer(type: string, buffer: Buffer): Promise<void>
  
  // Clear
  clear(): Promise<void>
}
```

### Simple Helper Functions
```typescript
global.copy(text: string): Promise<void>  // Alias for clipboard.writeText
global.paste(): Promise<string>           // Alias for clipboard.readText
```

## Implementation Details

### 1. SDK Implementation (sdk/src/target/app.ts:2838-2906)

Each clipboard method sends a specific channel message to the Electron app:

```typescript
global.clipboard = {
  readText: async () => await sendWait(Channel.CLIPBOARD_READ_TEXT),
  writeText: async (text: string) => await sendWait(Channel.CLIPBOARD_WRITE_TEXT, text),
  // ... other methods
}
```

**Special Cases:**
- **readImage**: Returns a Buffer by reading a temporary PNG file created by the app
- **writeImage**: Saves the Buffer to a temporary file before sending the path to the app

### 2. Channel Definitions (sdk/src/core/enum.ts:248-262)

All clipboard operations use dedicated channels:
```typescript
CLIPBOARD_READ_TEXT = "CLIPBOARD_READ_TEXT"
CLIPBOARD_READ_HTML = "CLIPBOARD_READ_HTML"
CLIPBOARD_READ_IMAGE = "CLIPBOARD_READ_IMAGE"
CLIPBOARD_READ_RTF = "CLIPBOARD_READ_RTF"
CLIPBOARD_READ_BOOKMARK = "CLIPBOARD_READ_BOOKMARK"
CLIPBOARD_READ_FIND_TEXT = "CLIPBOARD_READ_FIND_TEXT"
CLIPBOARD_WRITE_TEXT = "CLIPBOARD_WRITE_TEXT"
// ... etc
```

### 3. App Handlers (app/src/main/messages.ts)

Each channel has a corresponding handler that interfaces with Electron's clipboard API:

#### Read Operations
```javascript
CLIPBOARD_READ_TEXT: onChildChannelOverride(async ({ child }, { channel }) => {
  const value = clipboard.readText();
  childSend({ channel, value });
}),

CLIPBOARD_READ_IMAGE: onChildChannelOverride(async ({ child }, { channel }) => {
  const image = clipboard.readImage();
  let imageBuffer = image.toPNG();
  let imagePath = path.join(getKitTempDir(), `clipboard-image-${Date.now()}.png`);
  await fs.ensureDir(getKitTempDir());
  await fs.writeFile(imagePath, imageBuffer);
  childSend({ channel, value: imagePath });
}),
```

#### Write Operations
```javascript
CLIPBOARD_WRITE_TEXT: onChildChannelOverride(async ({ child }, { channel, value }) => {
  if (typeof value === 'object') value = JSON.stringify(value, null, 2);
  if (typeof value === 'number') value = String(value);
  clipboard.writeText(value);
  childSend({ channel, value });
}),

CLIPBOARD_WRITE_IMAGE: onChildChannelOverride(async ({ child }, { channel, value }) => {
  const image = nativeImage.createFromPath(value);
  clipboard.writeImage(image);
  childSend({ channel, value });
}),
```

### 4. Simple Copy/Paste Handlers

```javascript
COPY: onChildChannelOverride(async ({ child }, { channel, value }) => {
  if (value?.text) value = value.text;
  clipboard.writeText(value);
  childSend({ channel, value });
}),

PASTE: onChildChannelOverride(async ({ child }, { channel }) => {
  const value = clipboard.readText();
  childSend({ channel, value });
}),
```

## Data Type Details

### Text Operations
- **readText/writeText**: Plain text clipboard operations
- **Type conversion**: Objects are JSON stringified, numbers are converted to strings

### HTML Operations
- **readHTML/writeHTML**: HTML formatted content
- Preserves formatting when pasting into rich text editors

### Image Operations
- **readImage**: Returns PNG buffer regardless of original format
- **writeImage**: Accepts buffer, converts to native image format
- **Temporary files**: Uses system temp directory for image transfers

### RTF Operations
- **readRTF/writeRTF**: Rich Text Format content
- Platform-specific availability

### Bookmark Operations
- **readBookmark/writeBookmark**: URL bookmarks with titles
- Platform-specific (primarily macOS)

### Find Text Operations
- **readFindText/writeFindText**: System find pasteboard (macOS)
- Separate from main clipboard

### Custom Buffer Operations
- **writeBuffer**: Write custom MIME types
- Useful for application-specific data formats

## Platform Considerations

### macOS
- Full support for all clipboard formats
- Find text uses separate find pasteboard
- Bookmarks fully supported

### Windows
- Limited bookmark support
- No find text functionality
- RTF fully supported

### Linux
- Basic text/HTML/image support
- Limited RTF support
- No bookmark or find text support

## Clipboard History

Script Kit maintains a clipboard history (app/src/main/clipboard.ts):
- **Monitoring**: Automatic clipboard change detection
- **Storage**: Up to 128 items by default
- **Filtering**: Large items (>1280 chars text, >20MB images) excluded
- **Access**: Via `getClipboardHistory()` API

## Usage Examples

### Basic Text Operations
```typescript
// Copy text
await copy("Hello, World!")

// Paste text
const text = await paste()

// Using clipboard object
await clipboard.writeText("Hello, World!")
const text = await clipboard.readText()
```

### Working with Images
```typescript
// Read image from clipboard
const imageBuffer = await clipboard.readImage()
await writeFile("screenshot.png", imageBuffer)

// Write image to clipboard
const imageBuffer = await readFile("image.png")
await clipboard.writeImage(imageBuffer)
```

### HTML Content
```typescript
// Copy formatted HTML
await clipboard.writeHTML("<b>Bold text</b>")

// Read HTML with fallback to text
const html = await clipboard.readHTML()
const text = await clipboard.readText() // Plain text version
```

### Custom Data Types
```typescript
// Write custom MIME type
const data = Buffer.from("custom data")
await clipboard.writeBuffer("application/custom", data)
```

### Clearing Clipboard
```typescript
// Clear all clipboard content
await clipboard.clear()
```

## Error Handling
- All operations are async and may throw errors
- Platform-specific features fail gracefully
- Image operations validate file paths
- Type conversion handles edge cases

## Performance Considerations
- Image operations use temporary files (I/O overhead)
- Large data transfers may be slow
- Clipboard monitoring has minimal overhead
- History storage has size limits

## Security Notes
- Clipboard access requires no special permissions
- Scripts can read any clipboard content
- No sandboxing of clipboard operations
- Consider privacy when handling clipboard data


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/(sdk/src/core/enum.ts,/workspace/sdk/src/(sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.