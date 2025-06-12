# Hotkey API - Script Kit Orientation

## Overview

The `hotkey` API allows you to capture keyboard shortcuts and modifier key combinations from users. When called, it presents a prompt that waits for the user to press a combination of modifier keys (cmd, shift, option, control, etc.) followed by a regular key.

## Implementation Location

The `hotkey` function is defined in `/workspace/sdk/src/target/app.ts` at line 1888.

## Function Signature

```typescript
global.hotkey = async (placeholder = "Press a key combo:") => Promise<KeyData>
```

## Key Components

### Parameters
- `placeholder`: Either a string message or a full `PromptConfig` object
  - Default: `"Press a key combo:"`

### Return Value
The function returns a `KeyData` object containing:
```typescript
interface KeyData {
  key: KeyEnum            // The main key pressed
  keyCode: string        // The keyCode (e.g., "KeyE")
  command: boolean       // Whether command/cmd was held
  shift: boolean         // Whether shift was held
  option: boolean        // Whether option/alt was held
  control: boolean       // Whether control was held
  fn: boolean           // Whether fn was held
  hyper: boolean        // Whether hyper (cmd+shift+option+control) was held
  os: boolean           // OS key (Windows key)
  super: boolean        // Super key (cmd on Mac)
  win: boolean          // Windows key
  shortcut: string      // Human-readable shortcut (e.g., "command e")
}
```

## How It Works

1. **UI Display**: Shows a special hotkey UI (`UI.hotkey`) that waits for key input
2. **Modifier Detection**: Captures all held modifier keys when a non-modifier key is pressed
3. **Submission**: Automatically submits once a non-modifier key is pressed
4. **Shortcut Formatting**: Returns a formatted shortcut string for display

## Type Definition Reference

The `KeyData` interface is defined in `/workspace/sdk/src/types/kitapp.d.ts` at line 315.

## Usage Examples

### Basic Usage
```typescript
// Simple hotkey capture
let keyInfo = await hotkey()
await editor(JSON.stringify(keyInfo, null, 2))
```

### Custom Placeholder
```typescript
let keyInfo = await hotkey("Press your preferred shortcut:")
console.log(`You pressed: ${keyInfo.shortcut}`)
```

### With Full Config
```typescript
let keyInfo = await hotkey({
  placeholder: "Set a keyboard shortcut",
  hint: "Press modifier keys + a letter",
  onEscape: () => {
    console.log("User cancelled")
  }
})
```

### Practical Example - Command Palette
```typescript
// Create a command palette with hotkey shortcuts
let commands = [
  { name: "Save", action: "save" },
  { name: "Open", action: "open" },
  { name: "Copy", action: "copy" }
]

let keyInfo = await hotkey("Press a hotkey to execute:")

// Switch based on the pressed key
switch(keyInfo.key) {
  case "s":
    if (keyInfo.command) {
      console.log("Save command triggered")
    }
    break
  case "o":
    if (keyInfo.command) {
      console.log("Open command triggered")
    }
    break
  case "c":
    if (keyInfo.command) {
      console.log("Copy command triggered")
    }
    break
}
```

## Related APIs

- `registerShortcut`: Register global system shortcuts
- `keyboard`: Programmatically type or press keys
- `Key`: Enum of available key constants

## Common Use Cases

1. **Setting Custom Shortcuts**: Allow users to define their own keyboard shortcuts
2. **Command Palettes**: Create keyboard-driven command interfaces
3. **Shortcut Configuration**: Let users customize script shortcuts
4. **Quick Actions**: Trigger different actions based on modifier combinations


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/target/app.ts,/workspace/sdk/src/types/kitapp.d.ts"
```

This will generate a comprehensive report of all the implementation files for this API.