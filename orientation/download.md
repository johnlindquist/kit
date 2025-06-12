# download API Orientation

## Overview

The `download` API provides a simple way to download files from URLs to your local filesystem. It handles various protocols, follows redirects, and supports advanced options like authentication and custom headers.

## Core Concepts

### Basic Download
```javascript
// Download a file to current directory
await download("https://example.com/file.pdf")

// Download to specific location
await download("https://example.com/file.pdf", "downloads/")

// Download with custom filename
await download("https://example.com/file.pdf", "downloads/", {
  filename: "my-document.pdf"
})
```

## Features

### 1. **Multiple Files**
```javascript
// Download multiple files
await download([
  "https://example.com/file1.pdf",
  "https://example.com/file2.pdf",
  "https://example.com/file3.pdf"
], "downloads/")
```

### 2. **Authentication**
```javascript
// Basic authentication
await download("https://secured.com/file.zip", ".", {
  auth: {
    username: "user",
    password: "pass"
  }
})

// Bearer token
await download("https://api.example.com/file", ".", {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
```

### 3. **Progress Tracking**
```javascript
// Track download progress
await download("https://example.com/large-file.zip", ".", {
  onProgress: (progress) => {
    console.log(`Downloaded: ${progress.percent * 100}%`)
    console.log(`Speed: ${progress.bytesPerSecond} B/s`)
  }
})
```

## Common Patterns

### 1. **Download and Extract**
```javascript
// Download and unzip
let zipPath = await download("https://example.com/archive.zip", tmpPath())
await exec(`unzip ${zipPath} -d ${tmpPath("extracted")}`)
```

### 2. **Download with Retry**
```javascript
async function downloadWithRetry(url, dest, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await download(url, dest)
      
    } catch (error) {
      if (i === maxRetries - 1) throw error
      console.log(`Retry ${i + 1}/${maxRetries}...`)
      await wait(1000 * (i + 1)) // Exponential backoff
    }
  }
}
```

### 3. **Batch Downloads with Progress**
```javascript
// Download multiple files with overall progress
let urls = [
  "https://example.com/file1.pdf",
  "https://example.com/file2.pdf",
  "https://example.com/file3.pdf"
]

for (let [index, url] of urls.entries()) {
  console.log(`Downloading ${index + 1}/${urls.length}`)
  await download(url, "downloads/")
}
```

### 4. **Conditional Download**
```javascript
// Only download if file doesn't exist
async function downloadIfMissing(url, filepath) {
  if (await pathExists(filepath)) {
    console.log("File already exists, skipping download")
    return filepath
  }
  
  return await download(url, path.dirname(filepath), {
    filename: path.basename(filepath)
  })
}
```

## Options Reference

```javascript
await download(url, destination, {
  // Custom filename
  filename: "custom-name.ext",
  
  // HTTP headers
  headers: {
    'User-Agent': 'MyApp/1.0',
    'Accept': 'application/pdf'
  },
  
  // Authentication
  auth: {
    username: 'user',
    password: 'pass'
  },
  
  // Timeout in milliseconds
  timeout: 30000,
  
  // Follow redirects
  followRedirect: true,
  
  // Maximum redirects
  maxRedirects: 10,
  
  // Progress callback
  onProgress: (progress) => {
    // progress.percent: 0-1
    // progress.transferred: bytes downloaded
    // progress.total: total bytes
  },
  
  // Extract archives automatically
  extract: true,
  
  // For extracted files
  strip: 1, // Remove n leading directories
  
  // Proxy settings
  proxy: 'http://proxy.example.com:8080'
})
```

## Real-World Examples

### 1. **Download Script Dependencies**
```javascript
// Download required assets for a script
let assetsDir = kenvPath("assets")

await download([
  "https://example.com/icon.png",
  "https://example.com/data.json",
  "https://example.com/template.html"
], assetsDir)
```

### 2. **Download and Parse Data**
```javascript
// Download JSON and process
let dataPath = await download(
  "https://api.example.com/data.json",
  tmpPath()
)

let data = await readJson(dataPath)
console.log(`Loaded ${data.items.length} items`)
```

### 3. **Download Release Assets**
```javascript
// Download latest release from GitHub
let release = await get("https://api.github.com/repos/owner/repo/releases/latest")
let asset = release.data.assets.find(a => a.name.endsWith('.zip'))

if (asset) {
  await download(asset.browser_download_url, "downloads/", {
    filename: `${release.data.tag_name}.zip`
  })
}
```

### 4. **Mirror Website Resources**
```javascript
// Download website assets
let resources = [
  "https://example.com/style.css",
  "https://example.com/script.js",
  "https://example.com/logo.png"
]

let localDir = kenvPath("mirror", "example.com")
await ensureDir(localDir)

for (let resource of resources) {
  let filename = path.basename(resource)
  await download(resource, localDir, { filename })
}
```

## Error Handling

```javascript
try {
  await download("https://example.com/file.pdf", "downloads/")
} catch (error) {
  if (error.code === 'ENOTFOUND') {
    console.error("Server not found")
  } else if (error.code === 'ETIMEDOUT') {
    console.error("Download timed out")
  } else if (error.statusCode === 404) {
    console.error("File not found")
  } else {
    console.error("Download failed:", error.message)
  }
}
```

## Performance Tips

1. **Parallel Downloads**: Use `Promise.all()` for multiple files
```javascript
await Promise.all(urls.map(url => 
  download(url, "downloads/")
))
```

2. **Stream Large Files**: The download API handles streaming automatically

3. **Use Temporary Directory**: For processing files
```javascript
let tempFile = await download(url, tmpPath())
// Process file
await trash(tempFile) // Cleanup
```

## Related APIs

- **get()** - For downloading data into memory
- **readFile()** - Read downloaded files
- **tmpPath()** - Create temporary paths for downloads
- **exec()** - Process downloaded files (unzip, etc.)

## Repomix Command

To generate documentation for the download API implementation:

```bash
cd ~/scriptkit && npx @repomix/cli --include "sdk/src/globals/download.ts" "sdk/src/api/global.ts"
```