# Notify API - Complete Flow Documentation

## Overview

The notify API sends system notifications to the user's desktop. It provides a simple interface for displaying native OS notifications with support for titles, body text, icons, and platform-specific features like actions and inline replies.

## API Signature

```typescript
notify(options: string | NotificationConstructorOptions): Promise<void>
```

### Parameters

- **options**: Can be either:
  - **string**: Simple notification with just a title
  - **NotificationConstructorOptions**: Object with detailed notification settings

### NotificationConstructorOptions

```typescript
interface NotificationConstructorOptions {
  title?: string                              // Main notification text
  subtitle?: string                           // Secondary text (macOS only)
  body?: string                              // Detailed message
  silent?: boolean                           // Suppress notification sound
  icon?: string | NativeImage                // Icon path or image
  hasReply?: boolean                         // Show reply field (macOS)
  timeoutType?: "default" | "never"          // Auto-dismiss behavior (Linux/Windows)
  replyPlaceholder?: string                  // Reply field hint (macOS)
  sound?: string                             // Custom sound (macOS)
  urgency?: "normal" | "critical" | "low"    // Priority level (Linux)
  actions?: NotificationAction[]             // Action buttons (macOS)
  closeButtonText?: string                   // Close button label (macOS)
  toastXml?: string                         // Custom XML (Windows)
}
```

## Implementation Flow

### 1. SDK Implementation (sdk/src/target/app.ts)

The SDK provides a simple wrapper that normalizes input:

```typescript
global.notify = async options => {
  // Convert string to object format
  if (typeof options === "string") {
    options = { title: options }
  }
  // Send to app via IPC
  await sendWait(Channel.NOTIFY, options)
}
```

### 2. Message Transport

The notification request is sent via IPC:
- Channel: `Channel.NOTIFY`
- Payload: Normalized notification options object
- Uses `sendWait` for synchronous confirmation

### 3. App Handler Implementation (app/src/main/messages.ts)

The app creates and shows the notification:

```typescript
NOTIFY: onChildChannel(({ child }, { channel, value }) => {
  // Create Electron notification with provided options
  const notification = new Notification(value)
  
  // Display immediately
  notification.show()
  
  // No response needed - fire and forget
})
```

### 4. System Integration

Electron's Notification API interfaces with the OS:
- **macOS**: Native Notification Center
- **Windows**: Windows Toast Notifications
- **Linux**: Desktop notification system (libnotify)

## Platform-Specific Behavior

### macOS Features
- **Notification Center**: All notifications appear in Notification Center
- **Subtitle**: Secondary text line below title
- **Actions**: Interactive buttons on the notification
- **Inline Reply**: Text input field in notification
- **Sound**: Custom notification sounds
- **Permissions**: Automatic in Electron apps

### Windows Features
- **Action Center**: Notifications persist in Action Center
- **Toast XML**: Custom layouts via XML
- **Timeout**: Default auto-dismiss after ~5 seconds
- **Focus Assist**: Respects Windows quiet hours
- **Permissions**: Usually automatic

### Linux Features
- **Desktop Environment**: Varies by DE (GNOME, KDE, etc.)
- **Urgency Levels**: System respects priority hints
- **Timeout**: Configurable auto-dismiss
- **libnotify**: Common backend
- **Permissions**: Usually automatic

### Permission Requirements
- **macOS**: May need "Terminal Notifier" permissions in System Preferences
- **Windows**: Generally works without special permissions
- **Linux**: Depends on desktop environment settings

Script Kit helps with permissions:
- Menu bar icon → "Permissions → Request Notification Permissions"

## Complete Flow Diagram

```
Script                SDK                    IPC                    App                   OS
  |                    |                      |                      |                     |
  |--notify("Hi!")---->|                      |                      |                     |
  |                    |--normalize to------->|                      |                     |
  |                    |  {title: "Hi!"}     |                      |                     |
  |                    |                      |                      |                     |
  |                    |--Channel.NOTIFY----->|                      |                     |
  |                    |                      |--onChildChannel----->|                     |
  |                    |                      |                      |--new Notification-->|
  |                    |                      |                      |                     |
  |                    |                      |                      |--notification------>|
  |                    |                      |                      |    .show()          |
  |                    |                      |                      |                     |
  |                    |<----complete----------|<--fire & forget------|                     |
  |<--returns-----------|                      |                      |                     |
```

## Important Considerations

### Side Effects
- **User Interruption**: Notifications can distract users
- **Sound**: May play system sounds (unless silent: true)
- **Persistence**: Some platforms keep notifications in history
- **Focus Stealing**: Clicking may bring app to front

### Timing and Performance
- **Async Operation**: Returns after notification is queued
- **No Delivery Guarantee**: System may suppress notifications
- **Rate Limiting**: Some systems limit notification frequency
- **Queue Behavior**: Multiple notifications may stack

### Security Implications
- **Content Sanitization**: HTML is typically not supported
- **Icon Validation**: Invalid icon paths fail silently
- **Information Disclosure**: Notifications visible on lock screen
- **No Sensitive Data**: Avoid passwords, keys, etc.

### Known Limitations
- **No Click Handlers**: Script Kit doesn't support click callbacks
- **Limited Styling**: Can't customize appearance beyond OS options
- **Platform Variance**: Features work differently across OSes
- **No Updates**: Can't modify existing notifications
- **Text Length**: Long text may be truncated

## Usage Examples

### Basic Notifications
```typescript
// Simple text notification
await notify("Task completed!")

// With title and body
await notify({
  title: "Download Complete",
  body: "Your file has been downloaded successfully"
})
```

### Silent Notifications
```typescript
// No sound notification
await notify({
  title: "Background Task",
  body: "Processing complete",
  silent: true
})
```

### Platform-Specific Features
```typescript
// macOS with subtitle and actions
await notify({
  title: "New Message",
  subtitle: "John Doe",
  body: "Hey, are you free for lunch?",
  hasReply: true,
  replyPlaceholder: "Type your reply...",
  actions: [
    { type: "button", text: "Reply" },
    { type: "button", text: "Ignore" }
  ]
})

// Windows with custom timeout
await notify({
  title: "Reminder",
  body: "Meeting in 5 minutes",
  timeoutType: "never"  // Stays until dismissed
})

// Linux with urgency
await notify({
  title: "System Alert",
  body: "Critical update available",
  urgency: "critical"
})
```

### With Icons
```typescript
// Using Script Kit icon
await notify({
  title: "Script Kit",
  body: "Script completed successfully",
  icon: kitPath("assets", "icon.png")
})

// Platform-specific icon handling
const iconPath = process.platform === "darwin" 
  ? "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/Actions.icns"
  : kitPath("assets", "icon.png")

await notify({
  title: "Action Required",
  icon: iconPath
})
```

### Common Patterns
```typescript
// Success notification
async function notifySuccess(message: string) {
  await notify({
    title: "✅ Success",
    body: message,
    silent: false
  })
}

// Error notification
async function notifyError(error: Error) {
  await notify({
    title: "❌ Error",
    body: error.message,
    silent: false
  })
}

// Progress notifications
await notify("Starting download...")
// ... do work ...
await notify("Download complete!")
```

## Related APIs

### Complementary APIs
- **setStatus**: Updates menu bar icon with status
- **say**: Text-to-speech announcement
- **beep**: Simple audio alert
- **toast**: In-app toast notifications (if available)

### Alternative Approaches
- **div**: Show information in Script Kit window
- **log**: Persistent logging to file
- **menu**: Menu bar status updates

### When to Use Which
- Use `notify` for important user alerts that need attention
- Use `setStatus` for ongoing status updates
- Use `say` for audio announcements
- Use `beep` for simple audio feedback
- Use `div` for detailed information within Script Kit

## Best Practices

1. **Be Respectful**: Don't spam notifications
2. **Clear Messaging**: Use concise, actionable text
3. **Appropriate Urgency**: Only use critical for truly urgent items
4. **Test Permissions**: Ensure notifications work before relying on them
5. **Fallback Options**: Have alternatives if notifications fail
6. **Platform Testing**: Test on target platforms for consistency
7. **Silent Options**: Provide ways to disable notifications

## Error Handling

```typescript
try {
  await notify("Important message")
} catch (error) {
  // Fallback to console or other method
  console.error("Notification failed:", error)
  // Maybe show in Script Kit window instead
  await div(`⚠️ ${message}`)
}
```

## Debugging Tips

1. **Check Permissions**: Ensure app has notification permissions
2. **Test Simple First**: Start with just a title string
3. **Platform Limits**: Some features only work on certain OSes
4. **Icon Paths**: Verify icon files exist and are readable
5. **Console Logs**: Check app logs for notification errors


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/app/src/main/(app/src/main/messages.ts,/workspace/app/src/main/messages.ts,/workspace/sdk/src/(sdk/src/target/app.ts,/workspace/sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.