# Widget API - Complete Flow Documentation

## Overview

The widget API creates floating windows with custom HTML content. These windows can display interactive UIs using HTML, CSS (Tailwind), and JavaScript (Petite Vue), providing a way to create persistent, interactive interfaces that complement Script Kit's ephemeral prompts.

## API Signature

```typescript
widget(html: string, options?: WidgetOptions): Promise<WidgetAPI>
```

### Parameters

- **html**: HTML content or URL to display
  - String of HTML with Tailwind classes
  - URL starting with http:// or https:// (Pro feature)
- **options**: Optional Browser Window configuration
  - Standard Electron BrowserWindow options
  - Additional widget-specific options

### WidgetOptions

```typescript
interface WidgetOptions {
  // Window properties
  width?: number              // Default: 300
  height?: number             // Default: 300
  x?: number                  // Window x position
  y?: number                  // Window y position
  
  // Window behavior
  alwaysOnTop?: boolean       // Keep window above others
  draggable?: boolean         // Allow window dragging (default: true)
  resizable?: boolean         // Allow window resizing (default: true)
  hasShadow?: boolean         // Window shadow (default: true)
  transparent?: boolean       // Transparent background
  frame?: boolean             // Show window frame (default: false)
  
  // Widget-specific
  containerClass?: string     // CSS classes for container
  ignoreMouse?: boolean       // Click-through mode
  state?: any                 // Initial widget state
  css?: string               // Additional CSS
  
  // Standard BrowserWindow options...
}
```

### Return Value: WidgetAPI

```typescript
interface WidgetAPI {
  // State management
  setState(state: any): Promise<void>
  
  // Window control
  close(): Promise<void>
  show(): Promise<void>
  hide(): Promise<void>
  focus(): Promise<void>
  blur(): Promise<void>
  
  // Window state
  minimize(): Promise<void>
  maximize(): Promise<void>
  restore(): Promise<void>
  setAlwaysOnTop(flag: boolean): Promise<void>
  
  // Window geometry
  setSize(width: number, height: number): Promise<void>
  setPosition(x: number, y: number): Promise<void>
  fit(): Promise<void>  // Fit to content
  
  // Scripting
  executeJavaScript(code: string): Promise<any>
  
  // Event handlers
  onClick(handler: (event) => void): void
  onDrop(handler: (event) => void): void
  onMouseDown(handler: (event) => void): void
  onInput(handler: (event) => void): void
  onResized(handler: ({width, height}) => void): void
  onMoved(handler: ({x, y}) => void): void
  onInit(handler: () => void): void
  onClose(handler: () => void): void
}
```

## Implementation Flow

### 1. SDK Implementation (sdk/src/api/pro.ts)

The SDK creates the widget request and establishes communication:

```typescript
global.widget = async (html, options = {}) => {
  const defaultOptions = {
    containerClass: 'overflow-auto flex justify-center items-center v-screen h-screen',
    draggable: true,
    resizable: true,
  }
  
  // Send widget creation request
  const { widgetId } = await sendWait(Channel.WIDGET_GET, {
    command: global.kitCommand,
    html,
    options: { ...defaultOptions, ...options }
  })
  
  // Create API object with methods
  const widgetAPI = {
    setState: async (state) => {
      await sendWait(widgetMessageMap[Channel.WIDGET_SET_STATE], {
        widgetId,
        state
      })
    },
    // ... other methods
  }
  
  // Set up event handlers
  // Return API object
  return widgetAPI
}
```

### 2. Message Transport

Widget creation flow:
1. SDK sends `WIDGET_GET` with HTML and options
2. App creates window and assigns unique ID
3. App responds with widget ID
4. SDK creates API object for control

### 3. App Handler Implementation (app/src/main/messages.ts)

The app creates and manages the widget window:

```typescript
WIDGET_GET: onChildChannelOverride(async ({ child }, { html, options }) => {
  // Generate unique ID
  const widgetId = Date.now().toString()
  
  // Create widget window
  const widget = await showWidget(
    child.scriptPath,
    widgetId,
    html,
    options
  )
  
  // Track widget
  widgetState.widgets.push({
    id: widgetId,
    wid: widget.window.id,
    pid: child.pid,
    scriptPath: child.scriptPath,
    html,
    options
  })
  
  // Set up event forwarding
  widget.window.on('resize', () => {
    child.send(Channel.WIDGET_RESIZED, {
      widgetId,
      width: widget.window.getSize()[0],
      height: widget.window.getSize()[1]
    })
  })
  
  // Return widget ID
  childSend({ widgetId })
})
```

### 4. Window Creation (app/src/main/show.ts)

Creates the actual browser window:

```typescript
async function showWidget(scriptPath, widgetId, html, options) {
  const window = new BrowserWindow({
    width: options.width || 300,
    height: options.height || 300,
    frame: false,
    transparent: true,
    hasShadow: options.hasShadow !== false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: PRELOAD_PATH
    },
    ...options
  })
  
  // Load content
  if (isUrl(html)) {
    await window.loadURL(html)
  } else {
    await window.loadFile(WIDGET_HTML_PATH)
    // HTML content sent via IPC after load
  }
  
  return { window }
}
```

### 5. Renderer Process (widget.html + petite-vue)

The widget renderer provides reactivity and event handling:
- Uses Petite Vue for reactive state management
- Listens for state updates via IPC
- Forwards DOM events back to script
- Handles auto-resizing based on content

## Platform-Specific Behavior

### macOS
- Transparent backgrounds work well
- Smooth window animations
- Good shadow rendering
- Dock icon behavior configurable

### Windows
- Transparency requires careful configuration
- May have frame artifacts
- Different shadow behavior
- Taskbar handling varies

### Linux
- Transparency depends on compositor
- Window manager affects behavior
- Some features may not work

## Complete Flow Diagram

```
Script              SDK                 IPC                    App                 Widget Window
  |                  |                   |                      |                      |
  |--widget(html)--->|                   |                      |                      |
  |                  |--WIDGET_GET------>|                      |                      |
  |                  |  {html, options}  |                      |                      |
  |                  |                   |--showWidget()------->|                      |
  |                  |                   |                      |--new BrowserWindow-->|
  |                  |                   |                      |                      |
  |                  |                   |                      |--loadFile()--------->|
  |                  |                   |                      |                      |
  |                  |                   |<--WIDGET_GET---------|<--ready--------------|
  |                  |                   |   (from renderer)    |                      |
  |                  |                   |                      |                      |
  |                  |                   |--WIDGET_INIT-------->|--inject HTML-------->|
  |                  |                   |                      |                      |
  |                  |<--{widgetId}------|                      |                      |
  |<--WidgetAPI-------|                   |                      |                      |
  |                  |                   |                      |                      |
  |--setState()----->|--WIDGET_SET_STATE>|--forward----------->|--update UI---------->|
  |                  |                   |                      |                      |
  |                  |                   |<--WIDGET_CLICK-------|<--click event--------|
  |<--onClick()-------|<--forward---------|                      |                      |
```

## Important Considerations

### Side Effects
- **Window Creation**: Creates persistent OS window
- **Resource Usage**: Each widget consumes memory
- **Focus Stealing**: May take focus from other apps
- **Screen Space**: Occupies desktop real estate

### Timing and Performance
- **Async Creation**: Window creation takes time
- **State Updates**: React to state changes quickly
- **Event Throttling**: High-frequency events are throttled
- **Memory Management**: Close unused widgets

### Security Implications
- **Node Integration**: Full Node.js access in widgets
- **No Context Isolation**: Scripts run with full privileges
- **URL Loading**: Pro feature with sponsor check
- **XSS Risk**: Sanitize any user-provided HTML

### Known Limitations
- **No Frame**: Default frameless (use frame: true for frame)
- **Limited Native**: Can't access all OS window features
- **Event Forwarding**: Some DOM events not forwarded
- **State Size**: Large states may impact performance

## Usage Examples

### Basic Widget
```typescript
// Simple message widget
await widget(`
  <div class="p-4 text-2xl text-center">
    Hello from Script Kit! 
  </div>
`)
```

### Interactive Clock
```typescript
const clock = await widget(`
  <div class="p-5">
    <h1 class="text-7xl font-mono">{{time}}</h1>
  </div>
`, {
  width: 400,
  height: 150,
  alwaysOnTop: true,
  transparent: true,
  draggable: true
})

// Update time every second
setInterval(() => {
  clock.setState({
    time: new Date().toLocaleTimeString()
  })
}, 1000)
```

### Form Widget
```typescript
const form = await widget(`
  <div class="p-6 bg-white rounded-lg shadow-lg">
    <h2 class="text-xl mb-4">User Input</h2>
    <input 
      type="text" 
      class="border p-2 w-full mb-3"
      placeholder="Enter name"
      @input="$emit('input', $event)"
    />
    <button 
      class="bg-blue-500 text-white px-4 py-2 rounded"
      @click="$emit('click', {action: 'submit'})"
    >
      Submit
    </button>
  </div>
`)

let userName = ''

form.onInput((event) => {
  userName = event.value
})

form.onClick((event) => {
  if (event.action === 'submit') {
    console.log('Submitted:', userName)
    form.close()
  }
})
```

### Dashboard Widget
```typescript
const dashboard = await widget(`
  <div class="p-6 bg-gray-900 text-white">
    <h1 class="text-2xl mb-4">System Stats</h1>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <p class="text-gray-400">CPU</p>
        <p class="text-3xl">{{cpu}}%</p>
      </div>
      <div>
        <p class="text-gray-400">Memory</p>
        <p class="text-3xl">{{memory}}%</p>
      </div>
    </div>
  </div>
`, {
  width: 300,
  height: 200,
  alwaysOnTop: true,
  resizable: false
})

// Update stats
async function updateStats() {
  const stats = await getSystemStats() // Your implementation
  dashboard.setState({
    cpu: stats.cpu,
    memory: stats.memory
  })
}

setInterval(updateStats, 1000)
```

### Draggable Note
```typescript
const note = await widget(`
  <div class="p-4 bg-yellow-200 shadow-lg rounded">
    <div class="mb-2 cursor-move" @mousedown="$emit('drag')">
      <span class="text-gray-600">📌 Drag me</span>
    </div>
    <textarea 
      class="w-full h-32 p-2 bg-transparent resize-none"
      placeholder="Type your note..."
      @input="$emit('input', $event)"
    >{{content}}</textarea>
  </div>
`, {
  width: 250,
  height: 200,
  transparent: true,
  frame: false
})

note.onInput((event) => {
  // Auto-save note
  saveNote(event.value)
})
```

## Related APIs

### Complementary APIs
- **div**: For temporary UI within Script Kit
- **vite**: For complex React/Vue applications
- **term**: For terminal-based interfaces

### Alternative Approaches
- **Native Apps**: For full-featured applications
- **Web Apps**: For cross-platform compatibility
- **System Tray**: For background status

### When to Use Which
- Use `widget` for floating tools and dashboards
- Use `div` for script prompts and dialogs
- Use `vite` for complex SPAs
- Use native apps for system integration

## Advanced Features

### Custom CSS
```typescript
await widget(`<div class="custom">Hello</div>`, {
  css: `
    .custom {
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      padding: 20px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }
  `
})
```

### JavaScript Execution
```typescript
const w = await widget(`<div id="root"></div>`)

await w.executeJavaScript(`
  document.getElementById('root').innerHTML = 
    '<h1>Dynamic Content</h1>'
`)
```

### Event Handling
```typescript
const interactive = await widget(`
  <div class="p-4">
    <div 
      class="drop-zone border-2 border-dashed p-8"
      @drop="$emit('drop', $event)"
      @dragover.prevent
    >
      Drop files here
    </div>
  </div>
`)

interactive.onDrop(async (event) => {
  const files = event.dataTransfer.files
  console.log('Dropped files:', files)
})
```

### State Persistence
```typescript
// Load saved state
const savedState = await db('widget-state')

const w = await widget(`...`, {
  state: savedState || { count: 0 }
})

// Save state on change
w.setState = new Proxy(w.setState, {
  apply: async (target, thisArg, args) => {
    await target.apply(thisArg, args)
    await db('widget-state', args[0])
  }
})
```

## Best Practices

1. **Close Widgets**: Always close when done to free resources
2. **State Management**: Keep state minimal and serializable
3. **Error Handling**: Wrap event handlers in try-catch
4. **Performance**: Debounce high-frequency updates
5. **Accessibility**: Include proper ARIA labels
6. **Responsive Design**: Test different window sizes
7. **Clean UI**: Use consistent styling with Tailwind

## Debugging Tips

1. **Dev Tools**: Right-click widget for Chrome DevTools
2. **Console Logs**: Check both main and renderer logs
3. **State Inspection**: Log state changes
4. **Event Testing**: Add console.log to event handlers
5. **Error Boundaries**: Handle rendering errors gracefully


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/app/src/main/(app/src/main/messages.ts,/workspace/app/src/main/messages.ts,/workspace/app/src/main/show.ts,/workspace/sdk/src/(sdk/src/api/pro.ts,/workspace/sdk/src/api/pro.ts"
```

This will generate a comprehensive report of all the implementation files for this API.