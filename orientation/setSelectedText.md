# setSelectedText API Documentation

## Overview
The `setSelectedText` API allows scripts to paste text into the currently focused application by simulating a clipboard paste operation. It temporarily modifies the clipboard, triggers a paste command, and then restores the original clipboard content.

## API Signature
```typescript
global.setSelectedText = async (text = "", hide = true) => Promise<any>
```

### Parameters
- `text` (string): The text to paste into the focused application
- `hide` (boolean, default: true): Whether to hide the Script Kit window before pasting

### Return Value
Returns a Promise that resolves with the response from the app after the paste operation completes.

## Implementation Flow

### 1. SDK Side (sdk/src/lib/text.ts:25-32)

The function is defined as a global API:

```typescript
global.setSelectedText = async (text = "", hide = true) => {
  if (hide) await global.hide()
  
  return await sendWait(Channel.SET_SELECTED_TEXT, {
    text,
    hide,
  })
}
```

**Key Steps:**
1. If `hide` is true, calls `global.hide()` to hide the Script Kit window
2. Calls `sendWait` with the `SET_SELECTED_TEXT` channel and payload

### 2. Message Transport (sdk/src/target/app.ts)

The `sendWait` function (alias for `getDataFromApp`):
- Creates a unique message ID
- Sends the message via `send()` function
- Waits for a response with a 1000ms timeout

The `send` function (sdk/src/api/kit.ts:273-298) constructs the full payload:
```javascript
{
  pid: process.pid,
  promptId: global.__kitPromptId,
  kitScript: global.kitScript,
  channel: Channel.SET_SELECTED_TEXT,
  value: { text, hide }
}
```

This is sent to the Electron app via `process.send()`.

### 3. App Handler (app/src/main/messages.ts)

The app processes the message through the `SET_SELECTED_TEXT` handler:

```typescript
SET_SELECTED_TEXT: onChildChannelOverride(
  debounce(
    async ({ child }, { channel, value }) => {
      const text = value?.text;
      const hide = value?.hide;

      // Hide dock on macOS if requested
      if (hide && kitState.isMac && app?.dock && app?.dock?.isVisible()) {
        app?.dock?.hide();
      }

      // Save current clipboard
      const prevText = clipboard.readText();
      
      // Write new text to clipboard
      await clipboard.writeText(text);

      // Simulate paste
      robot.keyTap('v', getModifier());
      
      // Send response and restore clipboard
      setTimeout(() => {
        kitState.snippet = '';
        childSend({ channel, value });
        
        setTimeout(() => {
          clipboard.writeText(prevText);
        }, 250);
      }, 10);
    },
    50,
    { leading: true, trailing: false },
  ),
),
```

**Handler Steps:**
1. Extracts `text` and `hide` from the payload
2. Hides the dock on macOS if requested
3. Saves the current clipboard content
4. Writes the new text to the clipboard
5. Simulates a paste command using robotjs
6. Sends response back to SDK
7. Restores original clipboard content after 250ms

### 4. Platform-Specific Behavior

The paste command uses different modifiers per platform:
- **macOS**: `Cmd+V`
- **Windows/Linux**: `Ctrl+V`

This is handled by the `getModifier()` function which returns:
- `['command']` on macOS
- `['control']` on Windows/Linux

### 5. Response Flow

The app sends back the same channel and value to confirm completion:
```javascript
childSend({ channel, value })
```

This response is received by the SDK's `sendWait` function, which resolves the Promise.

## Important Considerations

### Timing
- The handler is debounced with 50ms delay (leading edge only)
- There's a 10ms delay before sending the response
- Clipboard restoration happens 250ms after the paste

### Clipboard Preservation
The API preserves the user's clipboard by:
1. Reading the current clipboard content
2. Temporarily replacing it with the text to paste
3. Restoring the original content after 250ms

### Window Management
By default, the Script Kit window is hidden before pasting to ensure the target application has focus. This can be disabled by passing `false` as the second parameter.

### Limitations
- Relies on clipboard manipulation, so it will temporarily affect the clipboard
- The 250ms delay for clipboard restoration means rapid successive calls might interfere
- Requires the target application to support standard paste commands
- Platform support depends on robotjs binary availability

## Usage Example

```typescript
import "@johnlindquist/kit"

// Simple usage - pastes text and hides window
await setSelectedText("Hello, World!")

// Keep window visible
await setSelectedText("Hello, World!", false)

// Replace selected text in an editor
const selectedText = await getSelectedText()
const modifiedText = selectedText.toUpperCase()
await setSelectedText(modifiedText)
```

## Dependencies
- **Electron's clipboard API**: For clipboard manipulation
- **@jitsi/robotjs**: For simulating keyboard input
- **Platform shims**: For loading platform-specific robotjs binaries

## Error Handling
The function uses a timeout mechanism in `sendWait`. If the app doesn't respond within 1000ms, the Promise will be rejected with a timeout error.


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/(sdk/src/api/kit.ts,/workspace/sdk/src/(sdk/src/lib/text.ts"
```

This will generate a comprehensive report of all the implementation files for this API.