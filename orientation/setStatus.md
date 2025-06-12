# SetStatus API - Complete Flow Documentation

## Overview

The `setStatus` API updates the Script Kit system tray icon to reflect different states (busy, error, success, etc.) and displays status messages. This provides visual feedback about script execution state directly in the system tray.

## API Signature

```typescript
setStatus(status: KitStatus): Promise<void>
```

### Parameters

- **status**: KitStatus object containing:
  - `status`: Status type (string)
  - `message`: Status message (string)

### Status Types

```typescript
type Status = 'default' | 'success' | 'warn' | 'busy' | 'error' | 'pause' | 'update'
```

Each status type displays a different tray icon:
- **default**: Normal Script Kit icon
- **success**: Green checkmark
- **warn**: Yellow warning
- **busy**: Spinning/animated indicator
- **error**: Red error indicator
- **pause**: Paused state icon
- **update**: Update available icon

### Return Value

Returns a Promise that resolves when the status has been updated.

## Implementation Flow

### 1. SDK Implementation (sdk/src/target/app.ts)

The SDK provides a simple interface:

```typescript
global.setStatus = async (status: KitStatus) => {
  await sendWait(Channel.SET_STATUS, status)
}
```

### 2. Message Transport

Status update uses:
- Channel: `Channel.SET_STATUS`
- Payload: KitStatus object
- Synchronous confirmation via `sendWait`

### 3. App Handler Implementation (app/src/main/messages.ts)

The app updates the global state:

```typescript
SET_STATUS: onChildChannel((_, data) => {
  if (data?.value) {
    kitState.status = data?.value
  }
})
```

### 4. Tray Icon Update (app/src/main/tray.ts)

A subscription watches for status changes:

```typescript
subscribeKey(kitState, 'status', (status: KitStatus) => {
  try {
    log.info(`🎨 Tray status: ${status.status}`)
    tray?.setImage(trayIcon(status.status))
  } catch (error) {
    log.error(error)
  }
})
```

The `trayIcon` function returns platform-specific icon paths:
- Each status has dedicated icon files
- Icons exist for both light and dark themes
- Platform-specific versions (macOS template images, Windows icons)

### 5. Status Message Handling

Status messages are stored and displayed:
- Messages accumulate in a list
- Shown when clicking the tray icon
- Cleared when tray menu closes
- Non-default statuses persist until changed

## Platform-Specific Behavior

### macOS
- **Icon Format**: Template images for menu bar
- **Dark Mode**: Automatic icon adaptation
- **Animation**: Smooth icon transitions
- **Position**: Right side of menu bar

### Windows
- **Icon Format**: ICO files for system tray
- **Animation**: Limited animation support
- **Balloon Tips**: Can show notifications
- **Position**: System tray (bottom right)

### Linux
- **Icon Format**: PNG files
- **Theme Support**: Follows system theme
- **Animation**: Depends on desktop environment
- **Position**: Varies by DE

## Complete Flow Diagram

```
Script              SDK                    IPC                    App                  Tray
  |                  |                      |                      |                     |
  |--setStatus({---->|                      |                      |                     |
  |  status:"busy",  |                      |                      |                     |
  |  message:"..."}) |                      |                      |                     |
  |                  |--SET_STATUS--------->|                      |                     |
  |                  |                      |--kitState.status=--->|                     |
  |                  |                      |                      |--subscribeKey------>|
  |                  |                      |                      |                     |
  |                  |                      |                      |--trayIcon("busy")->|
  |                  |                      |                      |                     |
  |                  |                      |                      |--setImage()-------->|
  |                  |                      |                      |                     |
  |                  |<----complete----------|                      |                     |
  |<--returns---------|                      |                      |                     |
  |                  |                      |                      |                     |
  |                  |                      |              User clicks tray              |
  |                  |                      |                      |<--show messages-----|
```

## Important Considerations

### Side Effects
- **Visual Change**: Immediately updates tray icon
- **Message Accumulation**: Messages stack up
- **State Persistence**: Status remains until changed
- **Global State**: Affects all Script Kit

### Timing and Performance
- **Instant Update**: Icon changes immediately
- **No Rate Limiting**: Can update frequently
- **Lightweight**: Minimal overhead
- **Reactive**: Uses Valtio subscriptions

### Security Implications
- **No Sensitive Data**: Avoid passwords in messages
- **Public Visibility**: Status visible to all users
- **Message Storage**: Messages temporarily stored
- **No Encryption**: Plain text messages

### Known Limitations
- **Single Status**: Only one status at a time
- **No Progress**: Can't show percentage
- **Limited Animation**: Platform-dependent
- **Message Length**: May truncate long messages
- **No Callbacks**: Can't detect clicks

## Usage Examples

### Basic Status Updates
```typescript
// Show busy status
await setStatus({
  status: 'busy',
  message: 'Processing files...'
})

// Show success
await setStatus({
  status: 'success',
  message: 'Task completed!'
})

// Reset to default
await setStatus({
  status: 'default',
  message: ''
})
```

### Task Progress Pattern
```typescript
async function processFiles(files: string[]) {
  await setStatus({
    status: 'busy',
    message: `Processing ${files.length} files...`
  })
  
  try {
    for (let i = 0; i < files.length; i++) {
      await processFile(files[i])
      await setStatus({
        status: 'busy',
        message: `Processing file ${i + 1}/${files.length}`
      })
    }
    
    await setStatus({
      status: 'success',
      message: 'All files processed!'
    })
  } catch (error) {
    await setStatus({
      status: 'error',
      message: `Error: ${error.message}`
    })
  }
}
```

### Long-Running Operations
```typescript
// Download with status
async function downloadWithStatus(url: string) {
  await setStatus({
    status: 'busy',
    message: 'Starting download...'
  })
  
  const downloader = download(url)
  
  downloader.on('progress', (progress) => {
    setStatus({
      status: 'busy',
      message: `Downloading: ${Math.round(progress.percent * 100)}%`
    })
  })
  
  downloader.on('complete', () => {
    setStatus({
      status: 'success',
      message: 'Download complete!'
    })
  })
  
  downloader.on('error', (error) => {
    setStatus({
      status: 'error',
      message: `Download failed: ${error}`
    })
  })
}
```

### Status with Cleanup
```typescript
// Ensure status is reset
async function safeOperation() {
  try {
    await setStatus({
      status: 'busy',
      message: 'Working...'
    })
    
    await performOperation()
    
    await setStatus({
      status: 'success',
      message: 'Done!'
    })
  } catch (error) {
    await setStatus({
      status: 'error',
      message: error.message
    })
    throw error
  } finally {
    // Reset after delay
    setTimeout(() => {
      setStatus({
        status: 'default',
        message: ''
      })
    }, 3000)
  }
}
```

### Multiple Status Messages
```typescript
// Queue multiple messages
async function multiStepProcess() {
  const steps = [
    'Initializing...',
    'Loading data...',
    'Processing...',
    'Finalizing...'
  ]
  
  for (const step of steps) {
    await setStatus({
      status: 'busy',
      message: step
    })
    await performStep(step)
  }
  
  await setStatus({
    status: 'success',
    message: 'All steps completed!'
  })
}
```

## Related APIs

### Complementary APIs
- **menu**: Persistent tray menu customization
- **notify**: One-time desktop notifications
- **say**: Audio status announcements
- **log**: Persistent message logging

### Alternative Approaches
- **Progress Bar**: Use widget for visual progress
- **Toast**: In-app notifications
- **Console**: Terminal output for CLI

### When to Use Which
- Use `setStatus` for ongoing operation status
- Use `notify` for important one-time alerts
- Use `menu` for persistent quick actions
- Use `log` for detailed operation history

## Advanced Patterns

### Status Manager
```typescript
class StatusManager {
  private timeout?: NodeJS.Timeout
  
  async setBusy(message: string) {
    this.clearTimeout()
    await setStatus({ status: 'busy', message })
  }
  
  async setSuccess(message: string, resetDelay = 3000) {
    this.clearTimeout()
    await setStatus({ status: 'success', message })
    this.timeout = setTimeout(() => this.reset(), resetDelay)
  }
  
  async setError(message: string, resetDelay = 5000) {
    this.clearTimeout()
    await setStatus({ status: 'error', message })
    this.timeout = setTimeout(() => this.reset(), resetDelay)
  }
  
  async reset() {
    this.clearTimeout()
    await setStatus({ status: 'default', message: '' })
  }
  
  private clearTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
  }
}
```

### Contextual Status
```typescript
// Show different status based on time
async function contextualStatus() {
  const hour = new Date().getHours()
  
  if (hour < 9) {
    await setStatus({
      status: 'pause',
      message: 'Good morning! Starting up...'
    })
  } else if (hour < 17) {
    await setStatus({
      status: 'busy',
      message: 'Work mode active'
    })
  } else {
    await setStatus({
      status: 'success',
      message: 'Wrapping up for the day'
    })
  }
}
```

### Error Tracking
```typescript
// Track and display error count
let errorCount = 0

async function trackErrors(operation: () => Promise<void>) {
  try {
    await operation()
    errorCount = 0
    await setStatus({
      status: 'success',
      message: 'Operation successful'
    })
  } catch (error) {
    errorCount++
    await setStatus({
      status: 'error',
      message: `Error (${errorCount}): ${error.message}`
    })
  }
}
```

## Best Practices

1. **Clear Messages**: Use concise, informative messages
2. **Reset Status**: Always reset after operations
3. **Error Handling**: Show errors with context
4. **Avoid Spam**: Don't update too frequently
5. **User Feedback**: Provide meaningful updates
6. **Timeout Resets**: Auto-reset after success/error
7. **Test Icons**: Verify all status icons display

## Debugging Tips

1. **Check Tray**: Ensure system tray is visible
2. **Log Status**: Console log status changes
3. **Verify Icons**: Check icon files exist
4. **Test All States**: Try each status type
5. **Message Length**: Test with long messages

## Common Issues

### Icon Not Changing
```typescript
// Force icon refresh
await setStatus({ status: 'default', message: '' })
await new Promise(r => setTimeout(r, 100))
await setStatus({ status: 'busy', message: 'Working...' })
```

### Messages Not Showing
```typescript
// Ensure non-empty message
await setStatus({
  status: 'busy',
  message: message || 'Processing...'  // Fallback
})
```

### Status Stuck
```typescript
// Always use try/finally for cleanup
try {
  await setStatus({ status: 'busy', message: 'Working...' })
  await riskyOperation()
} finally {
  await setStatus({ status: 'default', message: '' })
}
```


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/app/src/main/(app/src/main/messages.ts,/workspace/app/src/main/messages.ts,/workspace/app/src/main/tray.ts,/workspace/sdk/src/(sdk/src/target/app.ts,/workspace/sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.