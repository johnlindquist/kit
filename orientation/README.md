# Script Kit API Orientation Documents

This directory contains comprehensive orientation documents for Script Kit APIs. Each document follows a systematic approach to explain how the API works internally, from SDK implementation through to system integration.

## Document Structure

Each orientation document includes:
- **Overview**: Purpose and main use cases
- **API Signature**: Function parameters and return types
- **Implementation Flow**: How data flows from SDK to App to System
- **Platform-Specific Behavior**: Differences across operating systems
- **Complete Flow Diagram**: Visual representation of the API lifecycle
- **Usage Examples**: Practical code examples
- **Best Practices**: Recommendations and common patterns
- **Related APIs**: Similar or complementary functionality

## Available API Documentation

### Core Prompts & UI
- [arg.md](./arg.md) - Basic prompt for user input and selection
- [div.md](./div.md) - Display HTML/Markdown content
- [editor.md](./editor.md) - Full text editor with syntax highlighting
- [form.md](./form.md) - Multi-field form inputs
- [fields.md](./fields.md) - Key-value field editor
- [grid.md](./grid.md) - Grid layout for visual selection
- [select.md](./select.md) - Multi-select interface
- [drop.md](./drop.md) - Drag and drop interface
- [path.md](./path.md) - File and folder selection

### System Integration
- [clipboard.md](./clipboard.md) - System clipboard operations
- [copy-paste.md](./copy-paste.md) - Simple clipboard helpers
- [getSelectedText.md](./getSelectedText.md) - Get selected text from any app
- [setSelectedText.md](./setSelectedText.md) - Paste text at cursor
- [keyboard.md](./keyboard.md) - Keyboard automation
- [mouse.md](./mouse.md) - Mouse control
- [hotkey.md](./hotkey.md) - Capture keyboard shortcuts

### Notifications & Feedback
- [notify.md](./notify.md) - System notifications
- [say.md](./say.md) - Text-to-speech
- [beep.md](./beep.md) - System beep sound
- [toast.md](./toast.md) - In-app toast messages
- [menu.md](./menu.md) - System tray menu customization
- [setStatus.md](./setStatus.md) - System tray status updates

### Media & Input
- [mic.md](./mic.md) - Audio recording
- [webcam.md](./webcam.md) - Camera capture

### Windows & Display
- [widget.md](./widget.md) - Floating HTML windows
- [vite.md](./vite.md) - Vite-powered app widgets
- [hide-show.md](./hide-show.md) - Window visibility control

### File System & Data
- [db.md](./db.md) - Local JSON database
- [env.md](./env.md) - Environment variables
- [browse.md](./browse.md) - Open URLs in browser
- [download.md](./download.md) - Download files from URLs
- [trash.md](./trash.md) - Move files to trash
- [home.md](./home.md) - Home directory paths
- [tmpPath.md](./tmpPath.md) - Temporary file paths

### Development Tools
- [exec.md](./exec.md) - Execute shell commands
- [term.md](./term.md) - Interactive terminal
- [npm.md](./npm.md) - NPM package management
- [git.md](./git.md) - Git operations
- [inspect.md](./inspect.md) - Data inspection
- [template.md](./template.md) - String templating
- [md.md](./md.md) - Markdown to HTML conversion

### Utilities
- [wait-sleep.md](./wait-sleep.md) - Delay execution

## Using These Documents

### For SDK Developers
These documents provide deep insights into:
- How each API is implemented in the SDK
- IPC communication patterns
- Platform-specific considerations
- Performance implications

### For Script Authors
Learn about:
- Available features and options
- Best practices for each API
- Common usage patterns
- Integration between APIs

### For Contributors
Understand:
- The systematic approach to API documentation
- How to trace API implementations
- Testing considerations
- Cross-platform compatibility

## Contributing

When adding new API documentation:
1. Follow the established document structure
2. Trace the complete flow from SDK to system
3. Include practical examples
4. Document platform differences
5. Add the API to this README

## Additional Resources

- [API.md](/workspace/docs/API-GENERATED.md) - Official API reference
- [SDK Source](/workspace/sdk/src) - Implementation code
- [App Source](/workspace/app/src) - Electron app handlers