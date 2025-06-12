# home API Orientation

## Overview

The `home` API returns the path to the current user's home directory. It's a cross-platform way to access the user's home folder, essential for accessing user-specific files and directories.

## Core Concepts

### Basic Usage
```javascript
// Get home directory path
let homePath = home()
// macOS: /Users/username
// Windows: C:\Users\username
// Linux: /home/username

// Use in file paths
let documentsPath = path.join(home(), "Documents")
let configPath = path.join(home(), ".config", "myapp")
```

### Platform Independence
```javascript
// Works on all platforms
let desktop = path.join(home(), "Desktop")
let downloads = path.join(home(), "Downloads")
```

## Common Patterns

### 1. **User Configuration Files**
```javascript
// Access dotfiles and config directories
let gitConfig = path.join(home(), ".gitconfig")
let sshDir = path.join(home(), ".ssh")
let zshrc = path.join(home(), ".zshrc")

// Read user git config
if (await pathExists(gitConfig)) {
  let config = await readFile(gitConfig, "utf-8")
  console.log("Git user config found")
}
```

### 2. **Application Data**
```javascript
// Platform-specific app data locations
function getAppDataDir(appName) {
  if (isMac) {
    return path.join(home(), "Library", "Application Support", appName)
  } else if (isWin) {
    return path.join(home(), "AppData", "Local", appName)
  } else {
    return path.join(home(), ".config", appName)
  }
}

let appData = getAppDataDir("MyApp")
await ensureDir(appData)
```

### 3. **Desktop Operations**
```javascript
// Create file on desktop
let desktopPath = path.join(home(), "Desktop", "note.txt")
await writeFile(desktopPath, "Important note!")

// List desktop files
let desktop = path.join(home(), "Desktop")
let files = await readdir(desktop)
console.log(`${files.length} files on desktop`)
```

### 4. **Downloads Management**
```javascript
// Monitor downloads folder
let downloadsPath = path.join(home(), "Downloads")

// Get recent downloads
let downloads = await readdir(downloadsPath)
let recentDownloads = []

for (let file of downloads) {
  let filePath = path.join(downloadsPath, file)
  let stats = await stat(filePath)
  
  // Files from last 24 hours
  if (Date.now() - stats.mtime < 24 * 60 * 60 * 1000) {
    recentDownloads.push(file)
  }
}
```

## Real-World Examples

### 1. **Backup User Data**
```javascript
// Backup important directories
async function backupUserData() {
  let backupDir = path.join(home(), "Backups", new Date().toISOString().split('T')[0])
  await ensureDir(backupDir)
  
  let dirsToBackup = [
    ".ssh",
    ".gitconfig", 
    "Documents",
    ".zshrc",
    ".bashrc"
  ]
  
  for (let dir of dirsToBackup) {
    let source = path.join(home(), dir)
    if (await pathExists(source)) {
      let dest = path.join(backupDir, dir)
      await copy(source, dest)
      console.log(`Backed up ${dir}`)
    }
  }
}
```

### 2. **Environment Setup**
```javascript
// Check and setup development environment
async function setupDevEnvironment() {
  let configs = {
    git: path.join(home(), ".gitconfig"),
    ssh: path.join(home(), ".ssh"),
    npm: path.join(home(), ".npmrc"),
    zsh: path.join(home(), ".zshrc")
  }
  
  let missing = []
  for (let [name, path] of Object.entries(configs)) {
    if (!await pathExists(path)) {
      missing.push(name)
    }
  }
  
  if (missing.length > 0) {
    console.log("Missing configs:", missing.join(", "))
    // Setup missing configs...
  }
}
```

### 3. **User Templates**
```javascript
// Access user template directory
let templatesDir = path.join(home(), "Templates")
await ensureDir(templatesDir)

// List available templates
let templates = await readdir(templatesDir)
let template = await arg("Choose template:", templates)

// Copy template to current directory
await copy(
  path.join(templatesDir, template),
  path.join(process.cwd(), template)
)
```

### 4. **Cache Management**
```javascript
// Clear user caches
async function clearUserCaches() {
  let cacheLocations = []
  
  if (isMac) {
    cacheLocations = [
      path.join(home(), "Library", "Caches"),
      path.join(home(), ".cache")
    ]
  } else if (isWin) {
    cacheLocations = [
      path.join(home(), "AppData", "Local", "Temp")
    ]
  } else {
    cacheLocations = [
      path.join(home(), ".cache")
    ]
  }
  
  for (let cache of cacheLocations) {
    if (await pathExists(cache)) {
      let size = await getFolderSize(cache)
      console.log(`Cache at ${cache}: ${formatBytes(size)}`)
    }
  }
}
```

## Common Directories

```javascript
// Cross-platform user directories
let userDirs = {
  desktop: path.join(home(), "Desktop"),
  documents: path.join(home(), "Documents"),
  downloads: path.join(home(), "Downloads"),
  pictures: path.join(home(), "Pictures"),
  music: path.join(home(), "Music"),
  videos: path.join(home(), "Videos"),
  
  // Config locations
  config: isMac || isLinux ? 
    path.join(home(), ".config") : 
    path.join(home(), "AppData", "Roaming"),
    
  // Cache locations  
  cache: isMac ? 
    path.join(home(), "Library", "Caches") :
    isWin ?
    path.join(home(), "AppData", "Local") :
    path.join(home(), ".cache")
}
```

## Integration with Other APIs

### With path operations
```javascript
let filePath = path.resolve(home(), "Documents", "file.txt")
let relativePath = path.relative(home(), process.cwd())
```

### With file operations
```javascript
// Read file from home
let content = await readFile(
  path.join(home(), ".gitconfig"), 
  "utf-8"
)

// Write to desktop
await writeFile(
  path.join(home(), "Desktop", "note.txt"),
  "Hello!"
)
```

### With environment variables
```javascript
// home() is equivalent to:
let homePath = process.env.HOME || process.env.USERPROFILE
```

## Best Practices

### 1. **Always Use path.join()**
```javascript
// Good - works on all platforms
path.join(home(), "Documents", "file.txt")

// Bad - breaks on Windows
home() + "/Documents/file.txt"
```

### 2. **Check Existence**
```javascript
let configPath = path.join(home(), ".myapp")
if (await pathExists(configPath)) {
  // Read config
} else {
  // Create default config
}
```

### 3. **Handle Permissions**
```javascript
try {
  await writeFile(path.join(home(), ".config", "app.json"), data)
} catch (error) {
  if (error.code === 'EACCES') {
    console.error("Permission denied")
  }
}
```

## Related APIs

- **kenvPath()** - Script Kit specific paths
- **tmpPath()** - Temporary file paths
- **path.join()** - Build paths safely
- **ensureDir()** - Create directories

## Repomix Command

To generate documentation for the home API implementation:

```bash
cd ~/scriptkit && npx @repomix/cli --include "sdk/src/api/global.ts"
```