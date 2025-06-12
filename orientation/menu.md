# Menu API - Complete Flow Documentation

## Overview

The `menu` API allows scripts to customize the Script Kit system tray menu, setting a custom icon/emoji and providing quick access to frequently used scripts. This creates a persistent, easily accessible menu in the system tray area.

## API Signature

```typescript
menu(label: string, scripts?: string[]): Promise<void>
```

### Parameters

- **label**: Text or emoji to display in the system tray
  - Empty string ("") resets to default icon
  - Single emoji recommended for best display
  - Text support varies by platform
- **scripts**: Optional array of script names/paths
  - Script names without extension
  - Empty array or omitted to show only label

### Return Value

Returns a Promise that resolves when the menu has been updated.

## Implementation Flow

### 1. SDK Implementation (sdk/src/api/pro.ts)

The SDK sends the menu configuration to the app:

```typescript
let menu = async (label: string, scripts: string[] = []) => {
  return sendWait(Channel.SET_TRAY, {
    label,
    scripts
  })
}
```

### 2. Message Transport

The menu request uses:
- Channel: `Channel.SET_TRAY`
- Payload: Object with label and scripts array
- Synchronous confirmation via `sendWait`

### 3. App Handler Implementation (app/src/main/messages.ts)

The app updates the system tray:

```typescript
SET_TRAY: onChildChannel((_, { value }) => {
  const { label, scripts } = value
  
  // Update tray icon/text
  if (label) {
    // Create empty image to show text/emoji
    const image = nativeImage.createFromDataURL('')
    getTray()?.setImage(image)
    getTray()?.setTitle(label)  // Shows the emoji/text
  } else {
    // Reset to default icon
    getTray()?.setImage(getTrayIcon())
    getTray()?.setTitle('')
  }
  
  // Update menu items
  if (scripts?.length > 0) {
    setTrayMenu(scripts)
  } else {
    setTrayMenu([])  // Reset to default menu
  }
})
```

### 4. Menu Creation (app/src/main/tray.ts)

The tray menu builder:

```typescript
function setTrayMenu(scripts: string[]) {
  // Create menu items for each script
  const menuItems = scripts.map(script => ({
    label: script,
    click: () => {
      // Run script with menu trigger
      runScript(script, {
        force: true,
        trigger: Trigger.Menu
      })
    }
  }))
  
  // Add reset option
  menuItems.push({
    label: 'Reset Menu',
    click: () => menu('')  // Clear custom menu
  })
  
  // Build and set menu
  const contextMenu = Menu.buildFromTemplate(menuItems)
  getTray()?.setContextMenu(contextMenu)
  
  // Override tray click behavior
  getTray()?.removeAllListeners()
  getTray()?.on(isMac ? 'mouse-down' : 'click', () => {
    getTray()?.popUpContextMenu()
  })
}
```

## Platform-Specific Behavior

### macOS
- **Emoji Display**: Excellent support for emoji in menu bar
- **Text Display**: Shows next to other menu bar items
- **Click Behavior**: Uses `mouse-down` event
- **Position**: Right side of menu bar

### Windows
- **Emoji Display**: Good support in system tray
- **Text Display**: May be truncated or not visible
- **Click Behavior**: Uses `click` event
- **Position**: System tray (bottom right)

### Linux
- **Emoji Display**: Depends on desktop environment
- **Text Display**: Support varies by DE
- **Click Behavior**: Uses `click` event
- **Position**: System tray location varies

## Complete Flow Diagram

```
Script              SDK                    IPC                    App                System Tray
  |                  |                      |                      |                     |
  |--menu("🚀",----->|                      |                      |                     |
  |   ["script1"])   |                      |                      |                     |
  |                  |--SET_TRAY----------->|                      |                     |
  |                  |  {label: "🚀",       |                      |                     |
  |                  |   scripts:[...]}     |                      |                     |
  |                  |                      |--setImage()--------->|--update icon------>|
  |                  |                      |--setTitle("🚀")----->|                     |
  |                  |                      |                      |                     |
  |                  |                      |--setTrayMenu()------>|--build menu------->|
  |                  |                      |                      |                     |
  |                  |<----complete----------|                      |                     |
  |<--returns---------|                      |                      |                     |
  |                  |                      |                      |                     |
  |                  |                      |                User clicks menu item      |
  |                  |                      |<--click handler------|<--user click-------|
  |                  |                      |--runScript()-------->|                     |
```

## Important Considerations

### Side Effects
- **Persistent Change**: Menu remains until reset
- **System Resource**: Occupies system tray space
- **Global State**: Only one custom menu at a time
- **Visual Change**: Immediately visible to user

### Timing and Performance
- **Instant Update**: Changes appear immediately
- **No Animation**: Direct icon/menu replacement
- **Lightweight**: Minimal resource usage
- **State Persistence**: Survives script completion

### Security Implications
- **Script Access**: Listed scripts can be run by user
- **No Validation**: Assumes script names are valid
- **User Control**: User can always reset menu
- **Visibility**: Menu items visible to anyone

### Known Limitations
- **Single Menu**: Can't have multiple custom menus
- **No Submenus**: Flat menu structure only
- **No Icons**: Menu items are text only
- **Character Limits**: Long script names may truncate
- **No Separators**: Can't group menu items

## Usage Examples

### Basic Menu with Emoji
```typescript
// Set a rocket emoji with quick access scripts
await menu("🚀", [
  "daily-standup",
  "open-project",
  "time-tracker"
])
```

### Status Indicators
```typescript
// Show different status with emoji
async function setWorkStatus(status: 'available' | 'busy' | 'away') {
  const emojis = {
    available: "🟢",
    busy: "🔴",
    away: "🟡"
  }
  
  await menu(emojis[status], [
    "toggle-status",
    "set-slack-status"
  ])
}
```

### Dynamic Menu
```typescript
// Update menu based on context
const projectScripts = await getProjectScripts()
await menu("📁", projectScripts.map(s => s.name))
```

### Reset Menu
```typescript
// Clear custom menu and return to default
await menu("")
```

### Themed Menus
```typescript
// Development menu
await menu("💻", [
  "start-dev-server",
  "run-tests",
  "open-github",
  "check-ci"
])

// Communication menu
await menu("💬", [
  "check-slack",
  "compose-email",
  "schedule-meeting"
])
```

### Time-Based Menu
```typescript
// Change menu based on time of day
const hour = new Date().getHours()
if (hour < 12) {
  await menu("☀️", ["morning-routine", "check-calendar"])
} else if (hour < 17) {
  await menu("🏃", ["pomodoro-timer", "task-list"])
} else {
  await menu("🌙", ["daily-review", "shutdown-routine"])
}
```

## Related APIs

### Complementary APIs
- **setStatus**: Updates menu bar with temporary messages
- **notify**: One-time notifications
- **hotkey**: Global keyboard shortcuts
- **background**: Scripts that run continuously

### Alternative Approaches
- **Widget**: Floating window for more complex UI
- **System Menu**: Native application menus
- **Dock/Taskbar**: Application shortcuts

### When to Use Which
- Use `menu` for persistent quick-access scripts
- Use `setStatus` for temporary status messages
- Use `notify` for one-time alerts
- Use `widget` for complex interfaces

## Advanced Patterns

### Menu State Management
```typescript
// Store current menu state
let currentMenu = {
  label: "",
  scripts: []
}

async function updateMenu(label?: string, scripts?: string[]) {
  currentMenu.label = label ?? currentMenu.label
  currentMenu.scripts = scripts ?? currentMenu.scripts
  await menu(currentMenu.label, currentMenu.scripts)
}
```

### Conditional Scripts
```typescript
// Show different scripts based on conditions
const isDevelopment = await env("NODE_ENV") === "development"
const scripts = isDevelopment 
  ? ["dev-server", "test-runner", "db-console"]
  : ["deploy", "check-production", "view-logs"]

await menu("🔧", scripts)
```

### Menu Rotation
```typescript
// Cycle through different menu sets
const menuSets = [
  { label: "📝", scripts: ["note", "journal", "todo"] },
  { label: "🎯", scripts: ["focus", "break", "review"] },
  { label: "🛠", scripts: ["backup", "clean", "update"] }
]

let currentIndex = 0
async function rotateMenu() {
  currentIndex = (currentIndex + 1) % menuSets.length
  const { label, scripts } = menuSets[currentIndex]
  await menu(label, scripts)
}
```

## Best Practices

1. **Use Clear Emojis**: Choose recognizable, simple emojis
2. **Limit Scripts**: Keep menu concise (5-8 items max)
3. **Descriptive Names**: Use clear script names
4. **Group Related**: Theme your menu scripts
5. **Document Purpose**: Explain menu in comments
6. **Provide Reset**: Include way to reset menu
7. **Test Cross-Platform**: Verify emoji display

## Debugging Tips

1. **Check Tray**: Ensure system tray is visible
2. **Verify Scripts**: Confirm script names exist
3. **Test Emojis**: Try different emojis if not displaying
4. **Console Logs**: Check logs for menu errors
5. **Reset First**: Clear menu before testing

## Common Issues

### Emoji Not Showing
```typescript
// Fallback for platforms with poor emoji support
const isWindows = process.platform === 'win32'
await menu(isWindows ? "SK" : "🚀", scripts)
```

### Script Not Found
```typescript
// Validate scripts exist before adding to menu
const validScripts = scripts.filter(script => 
  scriptExists(script)  // Your validation
)
await menu("📋", validScripts)
```

### Menu Not Updating
```typescript
// Force update by resetting first
await menu("")  // Clear
await new Promise(r => setTimeout(r, 100))  // Small delay
await menu("🆕", newScripts)  // Set new menu
```


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/app/src/main/(app/src/main/messages.ts,/workspace/app/src/main/messages.ts,/workspace/app/src/main/tray.ts,/workspace/sdk/src/(sdk/src/api/pro.ts,/workspace/sdk/src/api/pro.ts"
```

This will generate a comprehensive report of all the implementation files for this API.