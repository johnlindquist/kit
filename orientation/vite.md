# Vite API - Script Kit Orientation

## Overview

The `vite` API allows you to create and run Vite-powered web applications as Script Kit widgets. It provides a seamless way to build interactive UIs using modern web frameworks like React, Vue, or vanilla JavaScript with hot module replacement (HMR) and all of Vite's development features.

## Implementation Location

The `vite` function is defined in `/workspace/sdk/src/api/pro.ts` at line 282.

## Function Signature

```typescript
let vite: ViteWidget = async (
  dir: string, 
  options?: ViteOptions
) => Promise<ViteAPI>
```

## Key Components

### Parameters
- `dir`: The directory name for your Vite project (created in `~/.kenv/vite/`)
- `options`: Configuration options for the Vite server and widget

### ViteOptions
```typescript
interface ViteOptions {
  mode?: string          // Vite mode: 'development' | 'production'
  port?: number          // Custom port for Vite server
  hidePrompt?: boolean   // Whether to hide the main prompt
  // Plus all standard widget options (size, position, etc.)
}
```

### ViteAPI Return Value
The function returns a `ViteAPI` object with:
```typescript
interface ViteAPI {
  // Widget control methods
  show(): void
  hide(): void
  close(): void
  focus(): void
  blur(): void
  minimize(): void
  maximize(): void
  restore(): void
  
  // Widget configuration
  setSize(width: number, height: number): void
  setPosition(x: number, y: number): void
  setAlwaysOnTop(flag: boolean): void
  
  // State and communication
  setState(state: any): void
  on(channel: string, handler: (data?: any) => void): () => void
  send(channel: string, data?: any): void
  
  // Utilities
  executeJavaScript(js: string): Promise<any>
  capturePage(): Promise<string>
}
```

## How It Works

1. **Project Creation**: First run creates a new Vite project in `~/.kenv/vite/{dir}`
2. **Server Start**: Launches a Vite dev server on specified port
3. **Widget Display**: Opens the Vite app in a Script Kit widget window
4. **Communication**: Provides bi-directional messaging between script and widget
5. **Cleanup**: Automatically closes server on script exit

## Project Structure

When you first use `vite("my-app")`, it creates:
```
~/.kenv/vite/my-app/
├── src/
│   ├── main.js/ts
│   ├── App.vue/jsx/tsx
│   └── global.d.ts     # TypeScript declarations for on/send
├── package.json
├── vite.config.js
└── index.html
```

## Usage Examples

### Basic Vite Widget
```typescript
// Create and display a Vite app
let widget = await vite("my-dashboard")

// Widget is now running at http://localhost:{port}
// and displayed in a draggable, resizable window
```

### With Custom Options
```typescript
let widget = await vite("todo-app", {
  port: 3000,
  width: 800,
  height: 600,
  alwaysOnTop: true
})
```

### Two-way Communication
```typescript
// In your Script Kit script
let widget = await vite("chat-app")

// Listen for messages from the widget
widget.on("message", (data) => {
  console.log("Received from widget:", data)
})

// Send data to the widget
widget.send("user-data", {
  name: "John",
  role: "admin"
})

// In your Vite app (src/main.js)
// These globals are automatically available
on("user-data", (data) => {
  console.log("Received user data:", data)
})

send("message", "Hello from Vite!")
```

### Dashboard Example
```typescript
// Create a system monitoring dashboard
let dashboard = await vite("system-monitor", {
  width: 400,
  height: 300,
  x: 100,
  y: 100
})

// Update dashboard with system stats
setInterval(async () => {
  let cpuUsage = await getCPUUsage()
  let memoryUsage = await getMemoryUsage()
  
  dashboard.send("stats", {
    cpu: cpuUsage,
    memory: memoryUsage,
    timestamp: Date.now()
  })
}, 1000)

// Handle dashboard requests
dashboard.on("request-details", async () => {
  let details = await getSystemDetails()
  dashboard.send("details", details)
})
```

### React Counter Widget
```typescript
// First run creates the project
let counter = await vite("react-counter")

// The created React app can use the messaging API:
// function App() {
//   const [count, setCount] = useState(0)
//   
//   useEffect(() => {
//     on("reset", () => setCount(0))
//     on("increment", () => setCount(c => c + 1))
//   }, [])
//   
//   return <button onClick={() => send("clicked", count)}>
//     Count: {count}
//   </button>
// }

// Control from Script Kit
counter.on("clicked", (currentCount) => {
  console.log(`Button clicked! Count: ${currentCount}`)
  if (currentCount >= 10) {
    counter.send("reset")
  }
})
```

### Widget State Management
```typescript
let widget = await vite("stateful-app")

// Set initial state
widget.setState({
  user: await getUserData(),
  preferences: await getPreferences()
})

// Update state later
widget.setState({
  notifications: await getNotifications()
})
```

## Best Practices

1. **Project Naming**: Use descriptive names for your Vite projects
2. **Port Management**: Let Script Kit assign ports automatically
3. **Communication**: Use typed channels for better maintainability
4. **Resource Cleanup**: Widget and server auto-close on script exit
5. **Development**: Use Vite's HMR for rapid development

## Common Use Cases

1. **Dashboards**: Real-time data visualization
2. **Tools**: Interactive utilities with modern UI
3. **Games**: Small games or interactive experiences
4. **Forms**: Complex forms with validation
5. **Media Players**: Audio/video players with custom controls

## Framework Support

Vite supports all major frameworks:
- React
- Vue
- Svelte  
- Preact
- Vanilla JS/TS
- And more...

## Related APIs

- `widget()`: For simpler HTML-based widgets
- `show()`/`hide()`: Control main prompt visibility
- `div()`: For markdown/HTML content in the main window


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/api/pro.ts"
```

This will generate a comprehensive report of all the implementation files for this API.