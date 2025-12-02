# Keyboard API - Complete Flow Documentation

## Overview

The keyboard API provides programmatic control over keyboard input, allowing scripts to type text, press key combinations, and simulate keyboard shortcuts. It uses the robotjs library under the hood for cross-platform keyboard automation.

## API Signature

```typescript
global.keyboard = {
  type: async (...textOrKeys: (string | Key)[]): Promise<void>
  typeDelayed: async (config: { rate: number; textOrKeys: string | Key[] }): Promise<void>
  pressKey: async (...keys: Key[]): Promise<void>
  releaseKey: async (...keys: Key[]): Promise<void>
  tap: async (...keys: Key[]): Promise<void>
  config: async (config: any): Promise<void>
}
```

### Parameters

- **type**: Accepts strings to type as text or Key enum values for special keys
- **typeDelayed**: Takes a config object with:
  - `rate`: Delay in milliseconds between each character (default: 600)
  - `textOrKeys`: Text string or array of Key values to type
- **pressKey**: Accepts Key enum values to press and hold
- **releaseKey**: Accepts Key enum values to release
- **tap**: Convenience method that presses then releases keys
- **config**: Configures keyboard behavior (implementation varies)

## Implementation Flow

### 1. SDK Implementation (sdk/src/target/app.ts)

The SDK exposes a global `keyboard` object with methods that communicate with the app via IPC channels:

```typescript
// Type text or keys
keyboard.type = async (...textOrKeys) => {
  await sendWaitLong(Channel.KEYBOARD_TYPE, textOrKeys, 0)
}

// Type with delay between characters
keyboard.typeDelayed = async (config) => {
  await sendWaitLong(Channel.KEYBOARD_TYPE_RATE, {
    rate: config?.rate || 600,
    textOrKeys: config.textOrKeys,
  }, 0)
}

// Press and hold keys
keyboard.pressKey = async (...keys) => {
  await sendWait(Channel.KEYBOARD_PRESS_KEY, keys)
}

// Release keys
keyboard.releaseKey = async (...keys) => {
  await sendWait(Channel.KEYBOARD_RELEASE_KEY, keys)
}

// Tap is a convenience method (not a separate channel)
keyboard.tap = async (...keys) => {
  await keyboard.pressKey(...keys)
  await keyboard.releaseKey(...keys)
}
```

### 2. Message Transport

The SDK uses `sendWait` or `sendWaitLong` to send messages to the app:
- Messages are sent via IPC with a specific channel and payload
- `sendWaitLong` is used for potentially long-running operations (typing)
- The SDK waits for a response before returning

### 3. App Handler Implementation (app/src/main/messages.ts)

The app processes keyboard messages using robotjs:

```typescript
// Handle typing text
KEYBOARD_TYPE: onChildChannel(async ({ child }, { channel, value }) => {
  for (const textOrKey of value) {
    if (typeof textOrKey === "string") {
      // Type regular text
      await shims['@jitsi/robotjs'].typeString(textOrKey)
    } else {
      // Handle special keys with modifiers
      const key = keyCodeFromKey(textOrKey)
      const modifiers = modifiersFromKey(textOrKey)
      await shims['@jitsi/robotjs'].keyTap(key, modifiers)
    }
  }
  childSend({ channel, value })
})

// Handle typing with delay
KEYBOARD_TYPE_RATE: onChildChannel(async ({ child }, { channel, value }) => {
  const { rate, textOrKeys } = value
  if (typeof textOrKeys === "string") {
    await shims['@jitsi/robotjs'].typeStringDelayed(textOrKeys, rate)
  } else {
    // Type array of keys with delay
    for (const key of textOrKeys) {
      await shims['@jitsi/robotjs'].keyTap(keyCodeFromKey(key), modifiersFromKey(key))
      await new Promise(resolve => setTimeout(resolve, rate))
    }
  }
  childSend({ channel, value })
})

// Handle key press (hold down)
KEYBOARD_PRESS_KEY: onChildChannel(async ({ child }, { channel, value }) => {
  for (const key of value) {
    await shims['@jitsi/robotjs'].keyToggle(
      keyCodeFromKey(key), 
      'down', 
      modifiersFromKey(key)
    )
  }
  childSend({ channel, value })
})

// Handle key release
KEYBOARD_RELEASE_KEY: onChildChannel(async ({ child }, { channel, value }) => {
  for (const key of value) {
    await shims['@jitsi/robotjs'].keyToggle(
      keyCodeFromKey(key), 
      'up', 
      modifiersFromKey(key)
    )
  }
  childSend({ channel, value })
})
```

### 4. Response Flow

1. App executes the keyboard action using robotjs
2. App sends response back via `childSend({ channel, value })`
3. SDK receives response and resolves the promise
4. Control returns to the script

## Platform-Specific Behavior

### Supported Platforms
- **macOS**: Full support via robotjs
- **Windows**: Full support on x64, limited on arm64
- **Linux**: Full support on x64, limited on arm64

### Platform Limitations
- Windows arm64 and Linux arm64 don't support robotjs
- On unsupported platforms, keyboard operations will fail silently

### Modifier Key Mapping
The app automatically handles platform-specific modifier keys:
- **macOS**: Uses Command (⌘) for shortcuts
- **Windows/Linux**: Uses Control (Ctrl) for shortcuts

## Complete Flow Diagram

```
Script                  SDK                      IPC                    App                    System
  |                      |                        |                      |                       |
  |--keyboard.type()---->|                        |                      |                       |
  |                      |--KEYBOARD_TYPE-------->|                      |                       |
  |                      |      + payload         |                      |                       |
  |                      |                        |--onChildChannel----->|                       |
  |                      |                        |                      |--robotjs.typeString-->|
  |                      |                        |                      |                       |
  |                      |                        |<----childSend--------|                       |
  |                      |<----response-----------|                      |                       |
  |<----returns----------|                        |                      |                       |
```

## Important Considerations

### Side Effects
- **Focus Required**: The keyboard API types into whatever application has focus
- **No Focus Management**: Scripts must ensure the correct window/field has focus
- **Real Keyboard Events**: Actions are indistinguishable from physical keyboard input

### Timing and Performance
- `sendWaitLong` is used with 0 timeout for keyboard operations
- `typeDelayed` allows controlling typing speed (useful for forms that can't handle fast input)
- Default delay for `typeDelayed` is 600ms between characters

### Security Implications
- Keyboard automation can type passwords or sensitive data
- Scripts should be careful about what they type and where
- Users may need to grant accessibility permissions on macOS

### Known Limitations
- Cannot detect current keyboard state
- Cannot intercept keyboard input
- Limited to robotjs key mappings
- No support for complex Unicode characters beyond basic text

## Usage Examples

### Basic Text Typing
```typescript
// Type simple text
await keyboard.type("Hello, world!")

// Type with special keys
await keyboard.type("Hello", Key.Space, "world", Key.Exclamation)
```

### Keyboard Shortcuts
```typescript
// Select all (Cmd/Ctrl+A)
await keyboard.tap(Key.LeftSuper, Key.A)

// Copy (Cmd/Ctrl+C)
await keyboard.tap(Key.LeftSuper, Key.C)

// Paste (Cmd/Ctrl+V)
await keyboard.tap(Key.LeftSuper, Key.V)
```

### Modifier Key Aliases

The "super" key maps to different physical keys across platforms:
- **macOS**: Command key
- **Windows**: Windows key
- **Linux**: Meta/Super key

Available Key enum values for this:
- `Key.LeftSuper` / `Key.RightSuper` - Original names
- `Key.Meta` / `Key.LeftMeta` / `Key.RightMeta` - Aliases for discoverability

All of these map to `'command'` which robotjs uses cross-platform.

### Advanced Key Control
```typescript
// Hold shift while typing
await keyboard.pressKey(Key.LeftShift)
await keyboard.type("hello") // Types "HELLO"
await keyboard.releaseKey(Key.LeftShift)

// Type slowly for compatibility
await keyboard.typeDelayed({
  rate: 100, // 100ms between characters
  textOrKeys: "username@example.com"
})
```

## Related APIs

### Complementary APIs
- **setSelectedText**: Pastes text at cursor position (faster than typing)
- **clipboard**: Direct clipboard manipulation
- **mouse**: Often used together for UI automation

### Legacy APIs
- **keystroke**: AppleScript-based, macOS only
- **pressKeyboardShortcut**: AppleScript-based, macOS only

### When to Use Which
- Use `keyboard` for cross-platform keyboard automation
- Use `setSelectedText` when you just need to insert text
- Use `clipboard` for data transfer without UI interaction
- Use legacy APIs only for macOS-specific scenarios

## Additional Keyboard Shortcuts

The app also provides dedicated channels for common shortcuts:
- `KEYBOARD_COPY`: Simulates Cmd/Ctrl+C
- `KEYBOARD_PASTE`: Simulates Cmd/Ctrl+V
- `KEYBOARD_CUT`: Simulates Cmd/Ctrl+X
- `KEYBOARD_SELECT_ALL`: Simulates Cmd/Ctrl+A
- `KEYBOARD_UNDO`: Simulates Cmd/Ctrl+Z

These are handled similarly but provide semantic meaning for common operations.


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/app/src/main/(app/src/main/messages.ts,/workspace/app/src/main/messages.ts,/workspace/sdk/src/(sdk/src/target/app.ts,/workspace/sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.