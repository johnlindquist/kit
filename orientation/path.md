# path API

## Overview

The `path` API provides an interactive file/folder browser that allows users to navigate the filesystem and select files or directories. It combines Node.js's path utilities with a visual file picker interface.

## Function Definition

```typescript
global.path = new Proxy(__pathSelector, {
  get: (target, k: string) => {
    if (k === 'then') return __pathSelector
    return ogPath[k]
  }
}) as any
```

## Location
- **SDK Definition**: `/src/target/path/path.ts` (line 486)
- **Channel**: Uses standard arg/prompt channels with custom UI
- **UI Type**: File browser interface with navigation

## Function Signature

```typescript
path(config?: string | PathConfig, actions?: Action[]): Promise<string>
```

### PathConfig Options

```typescript
interface PathConfig {
  startPath?: string           // Starting directory (default: home)
  onlyDirs?: boolean          // Show only directories
  missingChoices?: Choice[]   // Options shown when path doesn't exist
  enter?: string              // Enter button text
  // Plus all standard PromptConfig options
}
```

## How It Works

1. **Initial Load**: Opens at the specified start path or home directory
2. **Navigation**: Users can navigate in/out of folders using:
   - Arrow keys (left/right)
   - Tab/Shift+Tab
   - Direct path input
3. **File Display**: Shows files and folders with:
   - Icons (file/folder)
   - File size
   - Last modified time
4. **Path Creation**: Can create new files/folders if they don't exist
5. **Sorting**: Support for sorting by name, size, or date

## Key Features

- **Real-time Navigation**: Browse filesystem interactively
- **Path Filtering**: Filter using regex patterns
- **Create Missing Paths**: Options to create files/folders that don't exist
- **Symlink Support**: Properly handles symbolic links
- **Permission Handling**: Requests permissions for protected directories (macOS)
- **Sorting Options**: Sort by name, size, or date (Cmd+, Cmd+. Cmd+/)

## Usage Examples

```javascript
// Basic file selection
let selectedFile = await path()

// Start in specific directory
let downloadFile = await path(home("Downloads"))

// Select only directories
let folder = await path({
  startPath: home("Documents"),
  onlyDirs: true,
  placeholder: "Select a folder"
})

// With custom actions
let file = await path(home(), [
  {
    name: "Create New File",
    shortcut: "cmd+n",
    onAction: async () => {
      // Custom action logic
    }
  }
])
```

## Shortcuts

- **Left Arrow**: Navigate to parent directory
- **Right Arrow**: Enter selected directory
- **Cmd+,**: Sort by name
- **Cmd+.**: Sort by size
- **Cmd+/**: Sort by date
- **Tab**: Enter directory (forward)
- **Shift+Tab**: Go to parent directory (back)

## Special Features

### Missing Path Choices

When a typed path doesn't exist, the API offers:
- "Create File" (if not `onlyDirs`)
- "Create Folder"
- "Select Anyway"

### Permission Handling

On macOS, certain directories (Downloads, Documents, Desktop) require permissions. The API will:
1. Test write access
2. Show permission dialog if needed
3. Guide users to System Preferences

## Common Use Cases

1. **File Selection**: Choose files for processing
2. **Output Directory**: Select where to save results
3. **Project Navigation**: Browse and select project folders
4. **Configuration Paths**: Set file/folder paths in configs

## Path Utilities

Since `path` is a Proxy, it also provides all Node.js path methods:

```javascript
// Use as file picker
let file = await path()

// Use path utilities
let ext = path.extname(file)
let dir = path.dirname(file)
let base = path.basename(file)
let joined = path.join(dir, "newfile.txt")
```

## Notes

- Returns empty string if cancelled
- Automatically handles path separators for the OS
- Preserves exact indentation in symlink resolution
- Caches stat results for performance
- Supports ~ expansion to home directory

## Repomix Command

To generate documentation for the path API implementation:

```bash
cd ~/scriptkit && npx @repomix/cli --include "sdk/src/target/path/path.ts" "sdk/src/api/kit.ts"
```