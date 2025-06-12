# getSelectedText API Documentation

## Overview
The `getSelectedText` API retrieves the currently selected text from the focused application by simulating a copy operation (Cmd+C/Ctrl+C) and then reading the clipboard content.

## API Signature
```typescript
global.getSelectedText = async () => Promise<string>
```

### Parameters
None

### Return Value
Returns a Promise that resolves to:
- The selected text as a string
- An empty string if no text is selected or clipboard is empty/whitespace-only

## Implementation Flow

### 1. SDK Side (sdk/src/lib/text.ts:10-23)

The function is defined as a global API:

```typescript
global.getSelectedText = async () => {
  await global.hide()
  await sendWait(Channel.KEYBOARD_COPY)
  const result = await global.paste()
  
  if (result?.replace(/[\r\n]/g, "") === "") {
    return ""
  }
  
  return result
}
```

**Key Steps:**
1. Hides the Script Kit window to ensure target app has focus
2. Sends `KEYBOARD_COPY` channel to trigger copy operation
3. Reads clipboard content using `global.paste()`
4. Returns empty string if result is only whitespace

### 2. Copy Operation (app/src/main/messages.ts - KEYBOARD_COPY)

The app handles the `KEYBOARD_COPY` channel:

```javascript
KEYBOARD_COPY: onChildChannelOverride(
  debounce(
    async ({ child }, { channel, value }) => {
      if (!kitState.supportsNut) {
        log.warn('Keyboard type: Nut not supported on Windows arm64 or Linux arm64');
        return;
      }

      const modifier = getModifier();
      const beforeText = clipboard.readText();
      shims['@jitsi/robotjs'].keyTap('c', modifier);

      // Retry logic to ensure copy succeeded
      let afterText = clipboard.readText();
      const maxTries = 5;
      let tries = 0;
      while (beforeText === afterText && tries < maxTries) {
        afterText = clipboard.readText();
        tries++;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      childSend({ channel, value });
    },
    50,
    { leading: true, trailing: false },
  ),
)
```

**Handler Steps:**
1. Checks platform support (not available on Windows/Linux ARM64)
2. Gets platform-specific modifier key
3. Reads current clipboard content
4. Simulates Cmd+C/Ctrl+C using robotjs
5. Implements retry logic (up to 5 attempts) to ensure copy succeeded
6. Sends response back to SDK

### 3. Read Clipboard (sdk global.paste())

The `global.paste()` function sends a `PASTE` channel request:

```javascript
PASTE: onChildChannelOverride(async ({ child }, { channel }) => {
  const value = clipboard.readText();
  childSend({
    channel,
    value,
  });
})
```

This simply reads the clipboard and returns the text content.

### 4. Platform-Specific Behavior

The copy command uses different modifiers per platform:
- **macOS**: `Cmd+C`
- **Windows/Linux**: `Ctrl+C`

Platform limitations:
- **Windows ARM64**: Not supported (no robotjs binary)
- **Linux ARM64**: Not supported (no robotjs binary)
- **Other platforms**: Fully supported

### 5. Complete Flow Diagram

```
SDK (getSelectedText)
    |
    ├─1→ hide() - Hide Script Kit window
    |
    ├─2→ sendWait(KEYBOARD_COPY)
    |      |
    |      └→ App: robotjs.keyTap('c', modifier)
    |           |
    |           └→ System copies selected text to clipboard
    |
    ├─3→ paste() → sendWait(PASTE)
    |      |
    |      └→ App: clipboard.readText()
    |           |
    |           └→ Returns clipboard content
    |
    └─4→ Clean & return result
```

## Important Considerations

### Clipboard Side Effects
Unlike `setSelectedText` which preserves clipboard content, `getSelectedText` **modifies the clipboard** by copying the selected text into it. The original clipboard content is lost.

### Retry Mechanism
The copy operation includes intelligent retry logic:
- Compares clipboard before and after copy
- Retries up to 5 times with 100ms delays
- Ensures the copy operation actually changed the clipboard

### Timing
- Copy operation is debounced with 50ms delay
- Retry logic adds up to 500ms additional delay if needed
- Total operation time: 50ms to 550ms depending on retries

### Empty Selection Handling
The function handles empty selections by:
1. Checking if the result contains only whitespace/newlines
2. Returning an empty string instead of whitespace

### Platform Limitations
The function will fail silently on:
- Windows ARM64
- Linux ARM64

This is due to missing robotjs binaries for these platforms.

## Usage Example

```typescript
import "@johnlindquist/kit"

// Get selected text from any application
const selectedText = await getSelectedText()
console.log("Selected:", selectedText)

// Transform selected text
const selected = await getSelectedText()
if (selected) {
  const transformed = selected.toUpperCase()
  await setSelectedText(transformed)
}

// Check if text is selected
const text = await getSelectedText()
if (!text) {
  await notify("No text selected!")
}
```

## Comparison with setSelectedText

| Aspect | getSelectedText | setSelectedText |
|--------|----------------|-----------------|
| Purpose | Read selected text | Write/paste text |
| Clipboard | Modifies (copies to it) | Preserves (saves/restores) |
| Keyboard | Simulates Cmd/Ctrl+C | Simulates Cmd/Ctrl+V |
| Parameters | None | text, hide |
| Return | Selected text string | Confirmation |

## Dependencies
- **Electron's clipboard API**: For reading clipboard
- **@jitsi/robotjs**: For simulating keyboard input
- **Platform shims**: For loading platform-specific robotjs binaries

## Error Handling
- Platform support is checked before operation
- Retry mechanism ensures copy success
- Empty/whitespace results are normalized to empty string
- Timeout protection via `sendWait` (1000ms default)


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/(sdk/src/lib/text.ts"
```

This will generate a comprehensive report of all the implementation files for this API.