# editor API

## Overview

The `editor` API provides a full-featured code editor interface powered by Monaco Editor (the editor from VS Code). It allows users to write, edit, and manipulate text with syntax highlighting, code completion, and other IDE features.

## Function Definition

```typescript
global.editor = (async (
  options?: EditorOptions,
  actions?: Action[]
) => {
  // ... implementation
}) as any
```

## Location
- **SDK Definition**: `/src/target/app.ts` (line 1746)
- **Channel**: `SET_EDITOR_CONFIG`, `APPEND_EDITOR_VALUE`, `EDITOR_GET_SELECTION`, etc.
- **UI Type**: `UI.editor` - Full Monaco editor interface

## Function Signature

```typescript
editor(options?: string | EditorOptions, actions?: Action[]): Promise<string>
```

### EditorOptions

```typescript
interface EditorOptions {
  value?: string              // Initial editor content
  language?: string           // Syntax highlighting language
  scrollTo?: "top" | "bottom" // Initial scroll position
  onInput?: (value: string) => void
  onEscape?: () => void
  onAbandon?: () => void
  onPaste?: (event: any) => void
  onDrop?: (event: any) => void
  onBlur?: () => void
  // Plus standard PromptConfig options
}
```

## How It Works

1. **Initialization**: Creates a Monaco editor instance with specified options
2. **Language Support**: Automatically detects language from file extensions
3. **User Interaction**: Full text editing with IDE features
4. **Return Value**: Returns the final editor content when submitted

## Key Features

- **Syntax Highlighting**: Support for multiple languages (JS, TS, MD, CSS, JSON, etc.)
- **Code Completion**: IntelliSense and suggestions
- **Multiple Cursors**: Advanced editing capabilities
- **Theme Support**: Inherits Script Kit theme
- **Text Manipulation**: Methods to programmatically modify content

## Editor Methods

The editor object provides additional methods:

```typescript
editor.setSuggestions(suggestions: string[])    // Set autocomplete suggestions
editor.setConfig(config: EditorOptions)         // Update editor configuration
editor.append(value: string)                    // Append text to editor
editor.getSelection()                           // Get selected text
editor.getCursorOffset()                        // Get cursor position
editor.moveCursor(offset: number)               // Move cursor by offset
editor.insertText(text: string)                 // Insert text at cursor
editor.setText(text: string)                    // Replace all text
```

## Usage Examples

```javascript
// Basic text editing
let text = await editor("Initial content")

// With syntax highlighting
let code = await editor({
  value: "console.log('Hello')",
  language: "javascript",
  scrollTo: "bottom"
})

// Markdown editor with preview
let markdown = await editor({
  value: "# Hello World",
  language: "markdown",
  onInput: (value) => {
    setPreview(md(value)) // Live preview
  }
})

// With custom actions
let edited = await editor("", [
  {
    name: "Insert Date",
    shortcut: "cmd+d",
    onAction: async () => {
      await editor.insertText(new Date().toISOString())
    }
  }
])

// Using editor methods
await editor.setSuggestions(["option1", "option2", "option3"])
await editor.append("\n// New line")
let selected = await editor.getSelection()
```

## Language Mappings

The editor automatically maps file extensions to languages:

- `.js`, `.mjs`, `.jsx` → `javascript`
- `.ts`, `.tsx` → `typescript`
- `.md` → `markdown`
- `.css` → `css`
- `.json` → `json`

## Default Shortcuts

- **Cmd+Enter**: Submit editor content
- **Escape**: Cancel (if not disabled)
- **Cmd+S**: Often mapped to submit
- All standard Monaco/VS Code shortcuts

## Common Use Cases

1. **Code Editing**: Write or modify scripts
2. **Markdown Authoring**: Create documentation with live preview
3. **Configuration Editing**: Modify JSON/YAML configs
4. **Template Editing**: Create and edit templates
5. **Log Viewing**: Display and edit log files
6. **Note Taking**: Quick notes with formatting

## Advanced Features

### Live Preview
```javascript
let html = await editor({
  value: "<h1>Hello</h1>",
  language: "html",
  onInput: async (value) => {
    setPreview(value) // Live HTML preview
  }
})
```

### Custom Language Support
```javascript
let data = await editor({
  value: "name: John\nage: 30",
  language: "yaml", // Custom syntax highlighting
})
```

### Programmatic Control
```javascript
// Start editor
let result = editor("", {
  onInput: async (value) => {
    if (value.includes("TODO")) {
      await editor.setSuggestions(["TODO: Fix bug", "TODO: Add feature"])
    }
  }
})

// In another part of the script
await editor.append("\n// Generated code")
await editor.moveCursor(0) // Move to start
```

## Notes

- The editor maintains state during the session
- Supports large files efficiently
- Inherits theme from Script Kit settings
- Returns empty string if cancelled
- Full undo/redo support
- Supports all Monaco editor features

## Repomix Command

To generate documentation for the editor API implementation:

```bash
cd ~/scriptkit && npx @repomix/cli --include "sdk/src/target/app.ts"
```