# Toast API - Script Kit Orientation

## Overview

The `toast` API displays small, non-intrusive notification messages within the Script Kit window. Unlike system notifications, toasts appear inside the Script Kit interface and automatically dismiss after a specified time.

## Implementation Location

The `toast` function is defined in `/workspace/sdk/src/target/app.ts` at line 3335.

## Function Signature

```typescript
global.toast = async (text: string, options?: ToastOptions) => Promise<void>
```

## Key Components

### Parameters
- `text`: The message to display in the toast
- `options`: Optional configuration object

### ToastOptions Interface
```typescript
interface ToastOptions {
  pauseOnHover?: boolean      // Pause timer when hovering (default: true)
  pauseOnFocusLoss?: boolean  // Pause when window loses focus (default: true)
  closeOnClick?: boolean      // Close when clicked (default: true)
  autoClose?: number | false  // Auto-close delay in ms (default: 5000)
  hideProgressBar?: boolean   // Hide the progress bar (default: false)
  draggable?: boolean | 'mouse' | 'touch'  // Make draggable (default: 'touch')
  draggablePercent?: number   // Drag distance to dismiss (default: 80)
}
```

## How It Works

1. **Display**: Shows a toast notification inside the Script Kit window
2. **Auto-dismiss**: Automatically closes after the specified duration
3. **User Interaction**: Can be clicked or dragged to dismiss
4. **Progress Bar**: Shows remaining time visually
5. **Pause Behavior**: Timer pauses on hover or focus loss

## Internal Communication

The toast uses the `Channel.TOAST` channel to communicate with the main process:
```typescript
sendWait(Channel.TOAST, {
  text,
  options
})
```

## Usage Examples

### Basic Toast
```typescript
// Simple notification
await toast("Task completed successfully!")
```

### Custom Duration
```typescript
// Show for 10 seconds
await toast("Important: This message will stay longer", {
  autoClose: 10000
})
```

### Persistent Toast
```typescript
// Won't auto-close
await toast("Click to dismiss this message", {
  autoClose: false,
  closeOnClick: true
})
```

### Progress Indicator
```typescript
// Toast with progress tracking
await toast("Processing files...", {
  autoClose: 5000,
  hideProgressBar: false
})

// Simulate work
for (let i = 0; i < 5; i++) {
  await wait(1000)
  await toast(`Processing file ${i + 1} of 5...`)
}

await toast("All files processed!", {
  autoClose: 3000
})
```

### Interactive Toast
```typescript
// Toast that stays while hovering
await toast("Hover to keep me visible", {
  pauseOnHover: true,
  autoClose: 3000
})
```

### Multi-step Process
```typescript
// Show progress through multiple steps
const steps = [
  "Connecting to server...",
  "Authenticating...",
  "Downloading data...",
  "Processing...",
  "Complete!"
]

for (const step of steps) {
  await toast(step, { autoClose: 2000 })
  await wait(2000)
}
```

### Error Handling with Toast
```typescript
try {
  // Some operation
  let result = await fetchData()
  await toast("Data loaded successfully!", {
    autoClose: 3000
  })
} catch (error) {
  await toast(`Error: ${error.message}`, {
    autoClose: false,  // Keep error visible
    closeOnClick: true
  })
}
```

### Draggable Notifications
```typescript
// Toast that can be dragged away
await toast("Drag me away to dismiss", {
  draggable: 'mouse',
  draggablePercent: 50  // Drag 50% to dismiss
})
```

## Differences from notify()

| Feature | toast() | notify() |
|---------|---------|----------|
| Location | Inside Script Kit window | System notification area |
| Duration | Customizable auto-dismiss | System-controlled |
| Interaction | Click, drag, hover | System-dependent |
| Persistence | Temporary | Can persist in notification center |
| Styling | Script Kit themed | OS native style |

## Common Use Cases

1. **Progress Updates**: Show status of long-running operations
2. **Success Messages**: Confirm completed actions
3. **Warnings**: Non-critical alerts that don't need interaction
4. **Quick Info**: Display temporary information
5. **User Feedback**: Acknowledge user actions immediately

## Best Practices

1. **Message Length**: Keep messages concise and readable
2. **Duration**: Match duration to message importance
3. **Frequency**: Avoid spamming toasts rapidly
4. **Context**: Use for non-critical, informational messages
5. **Fallback**: Consider using `notify()` for critical alerts

## Related APIs

- `notify()`: System-level notifications
- `setStatus()`: Status bar messages
- `div()`: For more complex in-app messages
- `alert()`: For modal dialog messages


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.