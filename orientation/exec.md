# Exec API - Complete Flow Documentation

## Overview

The `exec` API provides a way to execute shell commands from within Script Kit scripts. It's a wrapper around the popular `execa` npm package, offering a simple interface for running command-line programs with proper error handling, output capture, and cross-platform shell support.

## API Signature

```typescript
exec: typeof import('execa').execaCommand

// Simplified signature:
exec(command: string, options?: Options): ExecaChildProcess<string>
```

### Parameters

- **command**: String containing the shell command to execute
- **options**: Optional configuration object
  - `cwd`: Working directory for the command (default: `process.cwd()`)
  - `shell`: Shell to use or boolean to enable shell mode (default: `true`)
  - `all`: Combine stdout and stderr into one stream (default: `true` in Script Kit)
  - Plus all other execa options

### Return Value

Returns an `ExecaChildProcess` promise that resolves to:
```typescript
{
  stdout: string      // Standard output
  stderr: string      // Standard error  
  all: string        // Combined stdout + stderr (when all: true)
  exitCode: number   // Process exit code
  command: string    // The command that was run
  // ... other execa properties
}
```

## Implementation Flow

### 1. SDK Implementation (sdk/src/globals/execa.ts)

The SDK provides a thin wrapper around execa's `execaCommand`:

```typescript
import { execaCommand } from 'execa'

// Set up exec with Script Kit defaults
global.exec = ((command: string, options: Options = { shell: true, cwd: process.cwd() }) => {
  return execaCommand(command, options)
}) as unknown as typeof execaCommand
```

Key defaults:
- `shell: true` - Enables shell mode for command interpretation
- `cwd: process.cwd()` - Uses current working directory

### 2. Direct Execution Model

Unlike many Script Kit APIs, `exec` doesn't use IPC channels:

```
Script              SDK (exec)           Node.js Process
  |                    |                      |
  |--await exec()----->|                      |
  |                    |--spawn child-------->|
  |                    |     process          |
  |                    |                      |
  |                    |<---stdout/stderr-----|
  |                    |                      |
  |<--result-----------|                      |
```

The command runs directly in a child process spawned by the script's Node.js runtime, not through the Electron app layer.

### 3. Shell Integration

With `shell: true` (default), commands are interpreted by:
- **Windows**: `cmd.exe` or PowerShell
- **macOS/Linux**: `/bin/sh` or specified shell

This enables:
- Shell features (pipes, redirects, wildcards)
- Environment variable expansion
- Command chaining with `&&`, `||`, `;`

### 4. Error Handling

Execa provides rich error objects when commands fail:
```typescript
try {
  await exec('false')  // Command that exits with code 1
} catch (error) {
  // error.exitCode - The exit code
  // error.stdout - Output before failure
  // error.stderr - Error output
  // error.command - The failed command
}
```

## Platform-Specific Behavior

### Shell Differences
- **Windows**: Uses `cmd.exe` by default, different command syntax
- **macOS/Linux**: Uses POSIX shell, consistent command syntax

### Path Handling
- Windows uses backslashes (`\`) in paths
- Unix systems use forward slashes (`/`)
- Execa handles some normalization, but be aware of differences

### Command Availability
Commands vary by platform:
- `ls` (Unix) vs `dir` (Windows)
- `grep` (Unix) vs `findstr` (Windows)
- Package managers: `brew` (macOS), `apt` (Ubuntu), `choco` (Windows)

## Complete Flow Diagram

```
Script                     SDK exec                    execa                    OS Shell
  |                           |                          |                         |
  |--await exec('ls -la')---->|                          |                         |
  |                           |--execaCommand()--------->|                         |
  |                           |   {shell: true,          |                         |
  |                           |    cwd: process.cwd()}   |                         |
  |                           |                          |--spawn('sh',['-c',---->|
  |                           |                          |       'ls -la'])        |
  |                           |                          |                         |
  |                           |                          |<----stdout: 'file1------|
  |                           |                          |     file2...'           |
  |                           |                          |                         |
  |                           |<---{stdout, stderr,------|                         |
  |<----result object---------|     exitCode: 0}        |                         |
```

## Important Considerations

### Side Effects
- **File System Changes**: Commands can modify files and directories
- **Network Access**: Commands can make network requests
- **System State**: Commands can change system settings or state
- **Resource Usage**: Long-running commands consume system resources

### Timing and Performance
- Commands run synchronously in the shell but async to the script
- No built-in timeout (use execa's `timeout` option if needed)
- Large outputs can consume significant memory
- Consider streaming for long-running commands

### Security Implications
- **Command Injection**: Never pass untrusted user input directly to exec
- **Path Traversal**: Be careful with file paths in commands
- **Privilege Escalation**: Avoid running commands with elevated privileges
- **Environment Variables**: May expose sensitive data

### Known Limitations
- Shell-specific syntax differences between platforms
- Some interactive commands don't work well (use `term` instead)
- Limited control over child process (for advanced use, use `execa` directly)
- Output buffering can delay real-time feedback

## Usage Examples

### Basic Command Execution
```typescript
// List files in home directory
const result = await exec('ls -la', {
  cwd: home()
})
console.log(result.stdout)

// Get current git branch
const { stdout: branch } = await exec('git branch --show-current')
```

### Error Handling
```typescript
try {
  await exec('npm test')
  console.log('Tests passed!')
} catch (error) {
  console.error('Tests failed:', error.stderr)
  console.error('Exit code:', error.exitCode)
}
```

### Platform-Specific Commands
```typescript
// Cross-platform file listing
const listCommand = process.platform === 'win32' ? 'dir' : 'ls -la'
const files = await exec(listCommand)

// Using specific shell
const result = await exec('echo $SHELL', {
  shell: '/bin/zsh'  // Use zsh specifically
})
```

### Working with Output
```typescript
// Parsing JSON output
const { stdout } = await exec('npm list --json')
const packages = JSON.parse(stdout)

// Combining stderr and stdout
const result = await exec('some-command 2>&1', {
  all: true  // Already default in Script Kit
})
console.log(result.all)  // Both stdout and stderr
```

### Common Patterns with UI
```typescript
// Show progress while running command
let result = await div({
  html: md(`# Running tests...`),
  onInit: async () => {
    try {
      const result = await exec('npm test')
      submit({ success: true, output: result.stdout })
    } catch (error) {
      submit({ success: false, error: error.stderr })
    }
  }
})
```

## Related APIs

### Complementary APIs
- **term**: For interactive commands or when you need a terminal UI
- **$**: Template literal syntax for commands (also from execa)
- **spawnSync/spawn**: Lower-level Node.js process APIs

### Execa Utilities
Script Kit also exposes other execa functions:
- **execa**: More control over process spawning
- **execaSync**: Synchronous execution
- **execaNode**: Execute Node.js scripts
- **$**: Template literal command execution

### When to Use Which
- Use `exec` for simple shell commands with output capture
- Use `term` for interactive commands (npm install, git commit, etc.)
- Use `execa` directly for advanced process control
- Use `$` for complex command composition with template literals

## Advanced Features

### Streaming Output
```typescript
// For long-running commands, consider streaming
const child = exec('npm install')
child.stdout.pipe(process.stdout)  // Stream to console
await child  // Wait for completion
```

### Environment Variables
```typescript
await exec('echo $MY_VAR', {
  env: {
    ...process.env,
    MY_VAR: 'custom value'
  }
})
```

### Working Directory
```typescript
// Run commands in specific directories
await exec('npm install', {
  cwd: path.join(home(), 'my-project')
})
```

### Shell Features
```typescript
// Pipes and redirects work with shell: true
await exec('cat file.txt | grep pattern > output.txt')

// Command chaining
await exec('npm test && npm build || echo "Failed"')
```

## Best Practices

1. **Always validate user input** before passing to exec
2. **Use appropriate error handling** for command failures
3. **Consider platform differences** when writing commands
4. **Set working directory explicitly** when needed
5. **Use `term` for interactive commands** instead of exec
6. **Check command availability** before running platform-specific commands
7. **Avoid hardcoded paths** - use Script Kit's path helpers instead


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/(sdk/src/globals/execa.ts,/workspace/sdk/src/globals/execa.ts"
```

This will generate a comprehensive report of all the implementation files for this API.