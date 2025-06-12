# tmpPath API Orientation

## Overview

The `tmpPath` API creates and returns paths within temporary directories specific to your script. It ensures each script has its own isolated temporary space that's automatically managed by the system.

## Core Concepts

### Basic Usage
```javascript
// Get script-specific temp directory
let tempDir = tmpPath()
// Returns: /tmp/kit/script-name/

// Create temp file path
let tempFile = tmpPath("data.json")
// Returns: /tmp/kit/script-name/data.json

// Create nested temp paths
let nestedPath = tmpPath("output", "processed", "file.txt")
// Returns: /tmp/kit/script-name/output/processed/file.txt
```

### Automatic Directory Creation
```javascript
// Directory is automatically created
let dir = tmpPath("subdirectory")
ensureDirSync(dir) // Already handled by tmpPath

// Symlink created in kenv for easy access
// ~/.kenv/tmp/script-name → /tmp/kit/script-name
```

## Features

### 1. **Script Isolation**
Each script gets its own temp directory based on its name:
```javascript
// In download-manager.js
tmpPath() // → /tmp/kit/download-manager/

// In data-processor.js  
tmpPath() // → /tmp/kit/data-processor/
```

### 2. **Persistent Across Runs**
Temp files persist between script runs until system cleanup:
```javascript
// First run
await writeJson(tmpPath("cache.json"), { data: "cached" })

// Later run - data still there
let cache = await readJson(tmpPath("cache.json"))
```

### 3. **Alias Support**
```javascript
// Both work identically
tmpPath("file.txt")
tmp("file.txt")  // Deprecated alias
```

## Common Patterns

### 1. **Download Processing**
```javascript
// Download to temp, process, then move
let tempFile = tmpPath("download.zip")
await download("https://example.com/data.zip", path.dirname(tempFile), {
  filename: path.basename(tempFile)
})

// Extract in temp
let extractDir = tmpPath("extracted")
await exec(`unzip ${tempFile} -d ${extractDir}`)

// Process files
let files = await readdir(extractDir)
// ... process files ...

// Clean up
await trash(tempFile)
```

### 2. **Data Transformation**
```javascript
// Use temp for intermediate files
async function processLargeCSV(inputPath) {
  let sorted = tmpPath("sorted.csv")
  let filtered = tmpPath("filtered.csv")
  let final = tmpPath("final.csv")
  
  // Multi-step processing
  await exec(`sort ${inputPath} > ${sorted}`)
  await exec(`grep -v "^#" ${sorted} > ${filtered}`)
  await exec(`cut -d, -f1,3,5 ${filtered} > ${final}`)
  
  return await readFile(final, "utf-8")
}
```

### 3. **Cache Management**
```javascript
// Simple file cache
async function getCachedData(key, fetcher) {
  let cachePath = tmpPath("cache", `${key}.json`)
  
  // Check cache
  if (await pathExists(cachePath)) {
    let cache = await readJson(cachePath)
    if (Date.now() - cache.timestamp < 3600000) { // 1 hour
      return cache.data
    }
  }
  
  // Fetch and cache
  let data = await fetcher()
  await ensureDir(path.dirname(cachePath))
  await writeJson(cachePath, {
    timestamp: Date.now(),
    data
  })
  
  return data
}

// Usage
let userData = await getCachedData("user-123", async () => {
  return await fetch("https://api.example.com/user/123").then(r => r.json())
})
```

### 4. **Build Artifacts**
```javascript
// Compile TypeScript to temp
async function compileTypeScript(sourceFile) {
  let outDir = tmpPath("build")
  await exec(`tsc ${sourceFile} --outDir ${outDir}`)
  
  let jsFile = path.join(outDir, 
    path.basename(sourceFile).replace('.ts', '.js'))
  
  return await readFile(jsFile, "utf-8")
}
```

## Real-World Examples

### 1. **Image Processing Pipeline**
```javascript
// Process images through temp directory
async function processImages(imagePaths) {
  let processedDir = tmpPath("processed-images")
  await ensureDir(processedDir)
  
  for (let imagePath of imagePaths) {
    let filename = path.basename(imagePath)
    let tempPath = tmpPath("working", filename)
    
    // Copy to temp
    await copyFile(imagePath, tempPath)
    
    // Apply transformations
    await exec(`convert ${tempPath} -resize 800x800 ${tempPath}`)
    await exec(`convert ${tempPath} -quality 85 ${tempPath}`)
    
    // Move to processed
    await move(tempPath, path.join(processedDir, filename))
  }
  
  return processedDir
}
```

### 2. **API Response Cache**
```javascript
// Cache API responses in temp
class APICache {
  constructor(apiName) {
    this.cacheDir = tmpPath("api-cache", apiName)
  }
  
  async get(endpoint, maxAge = 3600000) {
    let hash = crypto.createHash('md5').update(endpoint).digest('hex')
    let cachePath = path.join(this.cacheDir, `${hash}.json`)
    
    if (await pathExists(cachePath)) {
      let cached = await readJson(cachePath)
      if (Date.now() - cached.time < maxAge) {
        return cached.data
      }
    }
    
    return null
  }
  
  async set(endpoint, data) {
    let hash = crypto.createHash('md5').update(endpoint).digest('hex')
    let cachePath = path.join(this.cacheDir, `${hash}.json`)
    
    await ensureDir(this.cacheDir)
    await writeJson(cachePath, {
      time: Date.now(),
      endpoint,
      data
    })
  }
}
```

### 3. **Log Aggregation**
```javascript
// Collect logs in temp before processing
async function aggregateLogs() {
  let logDir = tmpPath("logs", new Date().toISOString().split('T')[0])
  await ensureDir(logDir)
  
  // Collect from various sources
  let sources = [
    "/var/log/app.log",
    home(".pm2/logs/app-out.log"),
    kenvPath("logs", "script.log")
  ]
  
  for (let source of sources) {
    if (await pathExists(source)) {
      let dest = path.join(logDir, path.basename(source))
      await copyFile(source, dest)
    }
  }
  
  // Create summary
  let summary = tmpPath("log-summary.txt")
  await exec(`grep ERROR ${logDir}/*.log > ${summary}`)
  
  return summary
}
```

### 4. **Database Exports**
```javascript
// Export database to temp before upload
async function exportDatabase() {
  let exportFile = tmpPath("exports", `backup-${Date.now()}.sql`)
  await ensureDir(path.dirname(exportFile))
  
  // Export database
  await exec(`pg_dump mydb > ${exportFile}`)
  
  // Compress
  let compressed = `${exportFile}.gz`
  await exec(`gzip ${exportFile}`)
  
  // Upload to cloud
  await uploadToS3(compressed)
  
  // Cleanup old exports
  let exports = await globby(tmpPath("exports", "*.gz"))
  let oldExports = exports.slice(0, -5) // Keep last 5
  await trash(oldExports)
  
  return compressed
}
```

## Best Practices

### 1. **Clean Up Large Files**
```javascript
// Always clean up large temp files
let bigFile = tmpPath("large-download.zip")
try {
  await download(url, path.dirname(bigFile))
  await processFile(bigFile)
} finally {
  await trash(bigFile)
}
```

### 2. **Use Subdirectories**
```javascript
// Organize temp files
let paths = {
  downloads: tmpPath("downloads"),
  cache: tmpPath("cache"),
  processing: tmpPath("processing"),
  output: tmpPath("output")
}

await ensureDir(Object.values(paths))
```

### 3. **Add Timestamps**
```javascript
// Prevent conflicts with timestamps
let timestamp = new Date().toISOString().replace(/:/g, '-')
let logFile = tmpPath("logs", `run-${timestamp}.log`)
```

## Platform Notes

- **Location varies by OS**:
  - macOS/Linux: `/tmp/kit/script-name/`
  - Windows: `%TEMP%\kit\script-name\`
- **Cleanup**: OS handles cleanup on reboot
- **Permissions**: User-specific, secure by default

## Related APIs

- **home()** - User home directory
- **kenvPath()** - Script Kit paths
- **ensureDir()** - Create directories
- **trash()** - Clean up temp files

## Repomix Command

To generate documentation for the tmpPath API implementation:

```bash
cd ~/scriptkit && npx @repomix/cli --include "sdk/src/api/kit.ts"
```