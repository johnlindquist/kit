# Term API - Complete Flow Documentation

## Overview

The `term` API opens an integrated terminal window within Script Kit, allowing scripts to run interactive commands with full pseudo-terminal (PTY) support. Unlike `exec`, which captures output, `term` provides a live terminal interface for commands that require user interaction.

## API Signature

```typescript
term(commandOrConfig?: string | TerminalConfig, actions?: Action[]): Promise<string>
```

### Parameters

- **commandOrConfig**: Either:
  - **string**: Command to execute in the terminal
  - **TerminalConfig**: Object with terminal configuration
- **actions**: Optional array of action buttons to display

### TerminalConfig

```typescript
interface TerminalConfig {
  command?: string              // Command to execute
  enter?: string               // Button text (default: "Continue")
  env?: Record<string, string> // Environment variables
  cwd?: string                 // Working directory
  shell?: string               // Shell to use
  height?: number              // Terminal height in pixels
  shortcuts?: Shortcut[]       // Keyboard shortcuts
  previewWidthPercent?: number // Width percentage for preview
}
```

### Return Value

Returns a Promise that resolves to the terminal output as a string when the user exits or continues.

## Implementation Flow

### 1. SDK Implementation (sdk/src/api/pro.ts)

The SDK configures the terminal prompt:

```typescript
global.term = async (commandOrConfig = '', actions?: Action[]) => {
  // Normalize input to config object
  const config: TerminalConfig = typeof commandOrConfig === 'string' 
    ? { command: commandOrConfig } 
    : commandOrConfig
  
  // Set defaults
  const termConfig = {
    command: config?.command || (await global.env.KIT_SHELL),
    enter: config?.enter || 'Continue',
    env: config?.env || {},
    height: config?.height || 480,
    previewWidthPercent: config?.previewWidthPercent || 60,
    actions: actions || [],
    shortcuts: config?.shortcuts || [],
    cwd: config?.cwd || process.cwd(),
    shell: config?.shell || (await global.env.KIT_SHELL),
  }
  
  // Create terminal prompt
  return await global.kitPrompt({
    ui: UI.term,
    ...termConfig
  })
}
```

### 2. Message Transport

The terminal flow uses multiple channels:
1. Initial setup via `kitPrompt` with `ui: UI.term`
2. Terminal creation via PTY system
3. Bidirectional communication for input/output
4. Exit handling and cleanup

### 3. Prompt Handler (app/src/main/prompt.ts)

When UI is set to `term`, the prompt system:

```typescript
if (promptData.ui === UI.term) {
  // Send terminal config to renderer
  this?.sendToPrompt(AppChannel.TERM_CONFIG, {
    kitScript: global.kitScript,
    command: promptData.command,
    cwd: promptData.cwd,
    env: { ...process.env, ...promptData.env },
    shell: promptData.shell,
  })
  
  // Create PTY instance
  this?.pty = await createPty(this)
}
```

### 4. PTY Creation (app/src/main/pty.ts)

The app creates a pseudo-terminal:

```typescript
async function createPty(processInfo: ProcessInfo) {
  // Get or create PTY from pool
  const ptyProcess = await ptyPool.acquire()
  
  // Configure PTY
  const ptyOptions = {
    cols: 80,
    rows: 24,
    cwd: config.cwd,
    env: config.env,
    shell: config.shell
  }
  
  // Set up event handlers
  ptyProcess.onData((data) => {
    // Send terminal output to renderer
    sendToPrompt(AppChannel.TERM_OUTPUT, data)
  })
  
  ptyProcess.onExit(({ exitCode }) => {
    // Handle terminal exit
    childSend(Channel.TERM_EXIT, { exitCode })
  })
  
  // Execute command if provided
  if (config.command) {
    ptyProcess.write(config.command + '\r')
  }
  
  return ptyProcess
}
```

### 5. Renderer Terminal UI

The renderer displays an xterm.js terminal:
- Receives output via `TERM_OUTPUT` channel
- Sends input via `TERM_INPUT` channel
- Handles resize events
- Manages terminal lifecycle

## Platform-Specific Behavior

### Shell Defaults
- **macOS**: `/bin/zsh` or user's default shell
- **Windows**: `cmd.exe` or PowerShell
- **Linux**: `/bin/bash` or user's default shell

### Terminal Emulation
- Uses `node-pty` for cross-platform PTY support
- Supports ANSI escape sequences
- Full terminal capabilities (colors, cursor control, etc.)

### Environment Variables
- Inherits process environment
- Can override with custom variables
- Shell initialization files are loaded

## Complete Flow Diagram

```
Script              SDK                Prompt System         PTY Manager         Terminal UI
  |                  |                     |                     |                    |
  |--term("ls"------>|                     |                     |                    |
  |                  |--kitPrompt--------->|                     |                    |
  |                  |   ui: UI.term       |                     |                    |
  |                  |                     |--createPty--------->|                    |
  |                  |                     |                     |--spawn pty-------->|
  |                  |                     |                     |                    |
  |                  |                     |--TERM_CONFIG------->|                    |
  |                  |                     |                     |                    |
  |                  |                     |<--TERM_READY--------|<--xterm ready------|
  |                  |                     |                     |                    |
  |                  |                     |                     |--write("ls\r")---->|
  |                  |                     |                     |                    |
  |                  |                     |<--onData------------|<--output-----------|
  |                  |                     |--TERM_OUTPUT------->|--display---------->|
  |                  |                     |                     |                    |
  |                  |                     |<--TERM_INPUT--------|<--user types-------|
  |                  |                     |--write to pty------>|                    |
  |                  |                     |                     |                    |
  |                  |                     |<--onExit------------|                    |
  |                  |<--TERM_EXIT---------|                     |                    |
  |<--output----------|                     |                     |                    |
```

## Important Considerations

### Side Effects
- **Interactive Process**: Spawns real shell/command
- **System Resources**: Consumes PTY and process
- **State Changes**: Commands can modify system
- **User Input**: Requires active user interaction

### Timing and Performance
- **Initialization**: Shell startup time varies
- **Real-time I/O**: No buffering of input/output
- **Process Lifecycle**: Managed by PTY pool
- **Cleanup**: Automatic on exit

### Security Implications
- **Full Shell Access**: Commands run with user privileges
- **Environment Exposure**: All env vars accessible
- **Command Injection**: Be careful with user input
- **No Sandboxing**: Full system access

### Known Limitations
- **No Detach**: Can't detach from running process
- **Limited Automation**: Meant for interactive use
- **Output Capture**: Returns final output only
- **Window Size**: Fixed initial dimensions

## Usage Examples

### Basic Command Execution
```typescript
// Run a simple command
await term("ls -la")

// Run with specific directory
await term({
  command: "npm install",
  cwd: home("projects/my-app")
})
```

### Interactive Shell
```typescript
// Open interactive shell
await term()  // Opens default shell

// Open specific shell
await term({
  shell: "/bin/zsh"
})
```

### Custom Environment
```typescript
// Run with custom environment
await term({
  command: "npm start",
  env: {
    NODE_ENV: "development",
    PORT: "3000"
  },
  cwd: projectPath
})
```

### With Action Buttons
```typescript
// Terminal with custom actions
const output = await term("npm test", [
  {
    name: "Rerun",
    onAction: async () => {
      await term("npm test")
    }
  },
  {
    name: "Debug",
    onAction: async () => {
      await term("npm test -- --inspect")
    }
  }
])
```

### Git Operations
```typescript
// Interactive git operations
await term("git status")
await term("git add -i")  // Interactive add
await term("git commit")  // Opens editor
```

### Long-Running Processes
```typescript
// Development server
await term({
  command: "npm run dev",
  cwd: projectPath,
  enter: "Stop Server"
})

// The terminal stays open until user clicks "Stop Server"
```

### Custom Terminal Size
```typescript
// Larger terminal for logs
await term({
  command: "tail -f /var/log/system.log",
  height: 600,
  enter: "Stop Watching"
})
```

## Related APIs

### Complementary APIs
- **exec**: For non-interactive commands
- **spawn**: Lower-level process control
- **div**: For command output display

### Alternative Approaches
- **System Terminal**: Open in external terminal
- **exec + div**: Capture and display output
- **PTY directly**: For advanced control

### When to Use Which
- Use `term` for interactive commands (npm install, git, ssh)
- Use `exec` for simple commands with output capture
- Use system terminal for long-running sessions
- Use div for displaying static output

## Advanced Usage

### Shell Integration
```typescript
// Load user's shell profile
await term({
  command: "source ~/.zshrc && my-alias",
  shell: "/bin/zsh"
})
```

### Process Management
```typescript
// Run multiple commands
await term(`
  cd my-project &&
  npm install &&
  npm test &&
  npm build
`)
```

### Error Handling
```typescript
try {
  const output = await term("npm test")
  if (output.includes("failed")) {
    await notify("Tests failed!")
  }
} catch (error) {
  // User cancelled or terminal error
  console.error("Terminal error:", error)
}
```

### Custom Shortcuts
```typescript
await term({
  command: "npm run dev",
  shortcuts: [
    {
      key: "cmd+r",
      name: "Restart",
      onShortcut: async () => {
        // Restart logic
      }
    }
  ]
})
```

## Best Practices

1. **Clear Commands**: Show users what command will run
2. **Working Directory**: Set appropriate cwd
3. **Error Messages**: Handle command failures gracefully
4. **Cleanup**: Ensure processes exit cleanly
5. **User Control**: Provide clear exit options
6. **Feedback**: Show command status/progress
7. **Documentation**: Explain what commands do

## Debugging Tips

1. **Check Shell**: Verify correct shell is used
2. **Environment**: Log environment variables
3. **Working Directory**: Confirm correct cwd
4. **Command Format**: Test commands manually first
5. **Exit Codes**: Check for command success/failure

## Common Issues

### Command Not Found
```typescript
// Ensure PATH is set correctly
await term({
  command: "my-command",
  env: {
    PATH: `${home(".local/bin")}:${process.env.PATH}`
  }
})
```

### Shell Features
```typescript
// Use shell-specific features carefully
await term({
  command: "echo $SHELL && which node",
  shell: "/bin/bash"  // Ensure bash for compatibility
})
```

### Color Support
```typescript
// Force color output
await term({
  command: "npm test",
  env: {
    FORCE_COLOR: "1"
  }
})
```


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "app/src/main/prompt.ts,app/src/main/pty.ts,sdk/src/api/pro.ts"
```

This will generate a comprehensive report of all the implementation files for this API.