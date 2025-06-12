# trash API Orientation

## Overview

The `trash` API safely moves files and folders to the system trash/recycle bin instead of permanently deleting them. This provides a safer alternative to permanent deletion and allows users to recover files if needed.

## Core Concepts

### Basic Usage
```javascript
// Move single file to trash
await trash("unwanted-file.txt")

// Move directory to trash
await trash("old-project/")

// Move multiple items
await trash(["file1.txt", "file2.txt", "old-folder/"])
```

### Glob Patterns
```javascript
// Trash all .tmp files
await trash("*.tmp")

// Trash all files in temp directories
await trash("**/temp/*")

// Multiple patterns
await trash(["*.log", "*.tmp", "cache/*"])
```

## Features

### 1. **Safe Deletion**
Unlike `rm` or `unlink`, trash moves files to the system trash where they can be recovered:
- **macOS**: Moves to Trash
- **Windows**: Moves to Recycle Bin  
- **Linux**: Follows freedesktop.org trash specification

### 2. **Glob Support**
```javascript
// Enable/disable glob patterns
await trash("*.txt", { glob: true })  // Default
await trash("file[1].txt", { glob: false }) // Treat as literal filename
```

### 3. **Alias Support**
```javascript
// Both work identically
await trash("file.txt")
await rm("file.txt")  // Alias for trash
```

## Common Patterns

### 1. **Clean Temporary Files**
```javascript
// Clean up after script execution
let tempFiles = await globby("*.tmp")
if (tempFiles.length > 0) {
  await trash(tempFiles)
  console.log(`Cleaned ${tempFiles.length} temporary files`)
}
```

### 2. **Safe File Replacement**
```javascript
// Backup existing file before creating new one
let configPath = "config.json"
if (await pathExists(configPath)) {
  await trash(configPath)
}
await writeJson(configPath, newConfig)
```

### 3. **Cleanup Old Backups**
```javascript
// Keep only recent backups
let backups = await globby("backup-*.zip")
let oldBackups = backups
  .sort()
  .slice(0, -5) // Keep last 5

if (oldBackups.length > 0) {
  await trash(oldBackups)
  console.log(`Removed ${oldBackups.length} old backups`)
}
```

### 4. **Project Cleanup**
```javascript
// Clean build artifacts
await trash([
  "dist/",
  "build/",
  "*.log",
  "node_modules/.cache/",
  "coverage/"
])
```

## Error Handling

```javascript
try {
  await trash("important-file.txt")
} catch (error) {
  if (error.message.includes("does not exist")) {
    console.log("File already removed")
  } else {
    console.error("Failed to trash file:", error)
  }
}
```

### Safe Trash Function
```javascript
// Helper that doesn't throw if file missing
async function safeTrash(pattern) {
  try {
    let files = await globby(pattern)
    if (files.length > 0) {
      await trash(files)
      return files.length
    }
    return 0
  } catch (error) {
    console.warn(`Could not trash ${pattern}:`, error.message)
    return 0
  }
}

// Usage
let cleaned = await safeTrash("*.tmp")
console.log(`Cleaned ${cleaned} files`)
```

## Real-World Examples

### 1. **Log Rotation**
```javascript
// Rotate log files
let logs = await globby("logs/*.log")
let sortedLogs = logs.sort((a, b) => {
  return (await stat(b)).mtime - (await stat(a)).mtime
})

// Keep only last 10 logs
if (sortedLogs.length > 10) {
  await trash(sortedLogs.slice(10))
}
```

### 2. **Download Cleanup**
```javascript
// Clean downloads older than 30 days
let downloads = await globby(`${home()}/Downloads/*`)
let thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)

let oldDownloads = []
for (let file of downloads) {
  let stats = await stat(file)
  if (stats.mtime < thirtyDaysAgo) {
    oldDownloads.push(file)
  }
}

if (oldDownloads.length > 0) {
  let confirm = await arg(`Delete ${oldDownloads.length} old downloads?`, 
    ["Yes", "No"])
  
  if (confirm === "Yes") {
    await trash(oldDownloads)
  }
}
```

### 3. **Cache Management**
```javascript
// Clear various caches
async function clearCaches() {
  let caches = [
    `${home()}/.npm/_cacache/`,
    `${home()}/.cache/yarn/`,
    `${kenvPath()}/node_modules/.cache/`,
    `${tmpPath()}/*`
  ]
  
  for (let cache of caches) {
    try {
      await trash(cache)
      console.log(`Cleared ${cache}`)
    } catch (e) {
      // Ignore if doesn't exist
    }
  }
}
```

### 4. **Build System Integration**
```javascript
// Clean task for build system
export async function clean() {
  console.log("Cleaning build artifacts...")
  
  await trash([
    "dist/**/*",
    "build/**/*", 
    ".parcel-cache/",
    "*.tsbuildinfo",
    "coverage/",
    "*.log"
  ])
  
  console.log("Clean complete!")
}
```

## Best Practices

### 1. **Always Confirm Destructive Actions**
```javascript
let files = await globby(pattern)
if (files.length > 0) {
  console.log("Files to delete:")
  files.forEach(f => console.log(`  - ${f}`))
  
  let confirm = await arg("Delete these files?", ["Yes", "No"])
  if (confirm === "Yes") {
    await trash(files)
  }
}
```

### 2. **Use Specific Patterns**
```javascript
// Too broad - might delete unintended files
// await trash("*")

// Better - be specific
await trash("temp-*.txt")
```

### 3. **Check Before Deleting**
```javascript
// Verify files exist and check what will be deleted
let targets = await globby(pattern)
if (targets.length === 0) {
  console.log("No files to clean")
  return
}

console.log(`Found ${targets.length} files to remove`)
await trash(targets)
```

## Platform Differences

- **macOS**: Uses native Trash API, maintains "Put Back" functionality
- **Windows**: Uses Recycle Bin, subject to size limits
- **Linux**: Uses XDG trash specification, may require trash-cli

## Related APIs

- **globby()** - Find files to trash using patterns
- **pathExists()** - Check if file exists before trashing
- **stat()** - Get file info for conditional deletion
- **ensureDir()** - Create directories (opposite of trash)

## Repomix Command

To generate documentation for the trash API implementation:

```bash
cd ~/scriptkit && npx @repomix/cli --include "sdk/src/api/global.ts"
```