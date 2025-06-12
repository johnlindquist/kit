# Mouse API Documentation

## Overview
The mouse API provides programmatic control over the system mouse cursor, including movement, clicking, and position retrieval. It uses native system APIs through the robotjs library to perform these operations.

## API Structure

### Mouse Object
```typescript
global.mouse = {
  leftClick(): Promise<void>
  rightClick(): Promise<void>
  move(points: { x: number; y: number }[]): Promise<void>
  setPosition(position: { x: number; y: number }): Promise<void>
}
```

### Additional Functions
```typescript
global.getMousePosition(): Promise<{ x: number; y: number }>
```

## Implementation Details

### 1. SDK Implementation (sdk/src/target/app.ts:2823-2836)

The mouse object is defined globally with four methods:

```typescript
global.mouse = {
  leftClick: async () => {
    await sendWait(Channel.MOUSE_LEFT_CLICK)
  },
  rightClick: async () => {
    await sendWait(Channel.MOUSE_RIGHT_CLICK)
  },
  move: async points => {
    await sendWaitLong(Channel.MOUSE_MOVE, points)
  },
  setPosition: async position => {
    await sendWait(Channel.MOUSE_SET_POSITION, position)
  },
}
```

**Key Points:**
- `move` uses `sendWaitLong` for potentially longer operations
- Other methods use standard `sendWait` with 1000ms timeout

### 2. Get Mouse Position (sdk/src/lib/desktop.ts)

```typescript
global.getMousePosition = async () => 
  (await global.getDataFromApp(Channel.GET_MOUSE)).mouseCursor
```

Returns the current mouse cursor coordinates.

### 3. Channel Definitions (sdk/src/core/enum.ts)

```typescript
MOUSE_SET_POSITION = 'MOUSE_SET_POSITION'
MOUSE_LEFT_CLICK = 'MOUSE_LEFT_CLICK'
MOUSE_RIGHT_CLICK = 'MOUSE_RIGHT_CLICK'
MOUSE_MOVE = 'MOUSE_MOVE'
GET_MOUSE = 'GET_MOUSE'
```

### 4. App Handlers (app/src/main/messages.ts)

#### GET_MOUSE Handler (Line 741)
```javascript
GET_MOUSE: onChildChannel(async ({ child }, { channel }) => {
  const mouseCursor = screen.getCursorScreenPoint()
  childSend({
    channel,
    mouseCursor,
  })
})
```
Uses Electron's screen API to get cursor position.

#### MOUSE_LEFT_CLICK Handler (Line 1999)
```javascript
MOUSE_LEFT_CLICK: onChildChannel(async ({ child }, { channel, value }) => {
  // REMOVE-NUT
  shims['@jitsi/robotjs'].mouseClick('left')
  childSend({ channel, value })
  // END-REMOVE-NUT
})
```

#### MOUSE_RIGHT_CLICK Handler (Line 2006)
```javascript
MOUSE_RIGHT_CLICK: onChildChannel(async ({ child }, { channel, value }) => {
  // REMOVE-NUT
  shims['@jitsi/robotjs'].mouseClick('right')
  childSend({ channel, value })
  // END-REMOVE-NUT
})
```

#### MOUSE_MOVE Handler (Line 2013)
```javascript
MOUSE_MOVE: onChildChannel(async ({ child }, { channel, value }) => {
  // REMOVE-NUT
  for (const v of value) {
    shims['@jitsi/robotjs'].moveMouseSmooth(v.x, v.y)
  }
  childSend({ channel, value })
  // END-REMOVE-NUT
})
```
Animates mouse movement through multiple points.

#### MOUSE_SET_POSITION Handler (Line 2022)
```javascript
MOUSE_SET_POSITION: onChildChannel(async ({ child }, { channel, value }) => {
  // REMOVE-NUT
  shims['@jitsi/robotjs'].moveMouse(value.x, value.y)
  childSend({ channel, value })
  // END-REMOVE-NUT
})
```
Instantly moves mouse to specified position.

## Method Details

### leftClick()
Performs a left mouse button click at the current cursor position.
- No parameters required
- Click happens at current mouse location
- No mouse movement involved

### rightClick()
Performs a right mouse button click at the current cursor position.
- No parameters required
- Click happens at current mouse location
- Opens context menus on most systems

### move(points)
Smoothly animates the mouse cursor through a series of points.
- **Parameters**: Array of `{x, y}` coordinates
- **Behavior**: Smooth animation between points
- **Use Case**: Drawing, gestures, or natural-looking movement

### setPosition(position)
Instantly moves the mouse cursor to a specific position.
- **Parameters**: Single `{x, y}` coordinate
- **Behavior**: Immediate jump to position
- **Use Case**: Quick positioning before clicks

### getMousePosition()
Retrieves the current mouse cursor position.
- **Returns**: `{x, y}` coordinate object
- **Coordinate System**: Screen coordinates (not window-relative)

## Platform Support

### Supported Platforms
- **macOS**: ✅ Full support (x64, arm64)
- **Windows**: ✅ Full support (x64, arm64)
- **Linux**: ✅ Full support (x64, arm64)

### Library Dependencies
- Uses `@jitsi/robotjs` (v0.6.16) for mouse control
- Loaded through platform-specific shim system
- Native binaries for each platform/architecture

## Usage Examples

### Basic Click Operations
```typescript
import "@johnlindquist/kit"

// Left click at current position
await mouse.leftClick()

// Right click at current position
await mouse.rightClick()
```

### Move and Click
```typescript
// Move to position then click
await mouse.setPosition({ x: 500, y: 300 })
await mouse.leftClick()

// Get current position
const pos = await getMousePosition()
console.log(`Mouse at: ${pos.x}, ${pos.y}`)
```

### Smooth Animation
```typescript
// Draw a square with smooth mouse movement
const points = [
  { x: 100, y: 100 },
  { x: 200, y: 100 },
  { x: 200, y: 200 },
  { x: 100, y: 200 },
  { x: 100, y: 100 }
]
await mouse.move(points)
```

### Drag Operations
```typescript
// Perform a drag from one point to another
await mouse.setPosition({ x: 100, y: 100 })
await mouse.leftClick() // Press down
await mouse.move([
  { x: 150, y: 150 },
  { x: 200, y: 200 }
])
// Note: No mouse up - you'd need keyboard.keyToggle for that
```

### Context Menu Automation
```typescript
// Right-click on specific coordinates
await mouse.setPosition({ x: 400, y: 300 })
await mouse.rightClick()
```

## Coordinate System

- **Origin**: Top-left corner of primary screen (0, 0)
- **Units**: Pixels
- **Multi-monitor**: Coordinates extend across all monitors
- **Negative Values**: Possible with multiple monitors

## Limitations

### No Drag Support
The API doesn't provide direct drag operations. To perform drags:
1. Use `mouse.leftClick()` to press
2. Use `mouse.move()` to drag
3. Would need `keyboard` API for mouse button release

### No Double-Click
No built-in double-click method. Implement with:
```typescript
await mouse.leftClick()
await wait(50) // Small delay
await mouse.leftClick()
```

### No Scroll Wheel
Mouse wheel operations not supported through this API.

### No Button State
Cannot query if mouse buttons are currently pressed.

## Performance Considerations

- **setPosition**: Instant, minimal overhead
- **move**: Slower due to animation, time depends on distance
- **Clicks**: Fast, typically < 10ms
- **getMousePosition**: Fast, uses Electron API

## Security and Privacy

### Permissions
- **macOS**: May require accessibility permissions
- **Windows**: No special permissions needed
- **Linux**: May require X11 permissions

### User Awareness
Mouse automation can be surprising to users:
- Consider visual indicators
- Document automated actions
- Allow user interruption

## Best Practices

### Coordinate Validation
```typescript
// Validate coordinates are within screen bounds
const displays = await getDisplays()
const primaryDisplay = displays[0]
const maxX = primaryDisplay.width
const maxY = primaryDisplay.height

if (x < 0 || x > maxX || y < 0 || y > maxY) {
  console.warn("Coordinates outside screen bounds")
}
```

### Error Handling
```typescript
try {
  await mouse.setPosition({ x: 500, y: 300 })
  await mouse.leftClick()
} catch (error) {
  console.error("Mouse operation failed:", error)
}
```

### User-Friendly Movement
```typescript
// Use smooth movement for user-visible actions
await mouse.move([
  currentPos,
  targetPos
])

// Use instant positioning for background operations
await mouse.setPosition(targetPos)
```

## Related APIs

- **keyboard**: For keyboard input and modifiers
- **getActiveScreen**: For screen information
- **getDisplays**: For multi-monitor setups
- **startDrag**: For file drag operations


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/(sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.