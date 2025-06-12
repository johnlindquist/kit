# inspect API Orientation

## Overview

The `inspect` API provides a convenient way to examine and save data structures to files for debugging and analysis. It automatically formats data and opens it in your editor for immediate viewing.

## Core Concepts

### Basic Usage
```javascript
// Inspect any data structure
let data = { name: "John", age: 30, hobbies: ["coding", "reading"] }
await inspect(data)
// Creates: /tmp/kit/script-name/2024-01-15-10-30-45.json
// Opens in editor automatically

// Inspect with custom filename
await inspect(data, "user-data.json")
// Creates: /tmp/kit/script-name/user-data.json
```

### Automatic Formatting
```javascript
// Objects → JSON with nice formatting
await inspect({ complex: { nested: { data: true }}})

// Strings → Text files
await inspect("Some log output", "output.log")

// Arrays → JSON
await inspect([1, 2, 3, 4, 5])
```

## Features

### 1. **Smart File Extension**
```javascript
// Automatically chooses extension based on data type
await inspect({ data: "json" })    // → .json file
await inspect("plain text")         // → .txt file
await inspect(customObject)         // → .json file
```

### 2. **Pretty Printing**
```javascript
// Data is formatted with proper indentation
let complexData = {
  users: [
    { id: 1, name: "Alice", roles: ["admin", "user"] },
    { id: 2, name: "Bob", roles: ["user"] }
  ],
  settings: {
    theme: "dark",
    notifications: true
  }
}
await inspect(complexData)
// Output is nicely indented JSON
```

### 3. **Timestamp Filenames**
```javascript
// Default filename includes timestamp
await inspect(data)
// Creates: 2024-01-15-10-30-45.json

// Custom filename overrides timestamp
await inspect(data, "my-data.json")
// Creates: my-data.json
```

## Common Patterns

### 1. **Debug API Responses**
```javascript
// Inspect API response for debugging
let response = await fetch("https://api.example.com/users")
let data = await response.json()

// Save and view the response
await inspect(data, "api-response.json")

// Inspect headers too
await inspect({
  status: response.status,
  headers: Object.fromEntries(response.headers),
  data: data
}, "full-response.json")
```

### 2. **Log Complex Objects**
```javascript
// When console.log isn't enough
let complexObject = {
  circular: null,
  functions: {
    greet: () => "Hello",
    calculate: (x, y) => x + y
  },
  largeArray: Array(1000).fill(0).map((_, i) => ({
    id: i,
    value: Math.random()
  }))
}

// inspect handles complex objects gracefully
await inspect(complexObject, "complex-debug.json")
```

### 3. **Compare Data States**
```javascript
// Track how data changes over time
let dataBefore = await fetchData()
await inspect(dataBefore, "data-before.json")

// Perform operations...
await processData(dataBefore)

let dataAfter = await fetchData()
await inspect(dataAfter, "data-after.json")

// Now you can compare both files in your editor
```

### 4. **Error Debugging**
```javascript
try {
  let result = await riskyOperation()
  await inspect(result, "success-result.json")
} catch (error) {
  // Inspect error details
  await inspect({
    message: error.message,
    stack: error.stack,
    code: error.code,
    timestamp: new Date().toISOString(),
    context: {
      script: global.kitScript,
      args: global.args
    }
  }, "error-details.json")
}
```

## Real-World Examples

### 1. **API Development Helper**
```javascript
// Tool for API development and debugging
async function apiDebugger(method, url, options = {}) {
  let startTime = Date.now()
  
  try {
    let response = await fetch(url, { method, ...options })
    let data = await response.json()
    
    await inspect({
      request: {
        method,
        url,
        headers: options.headers,
        body: options.body
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        data
      },
      timing: {
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }, `api-${method}-${Date.now()}.json`)
    
    return data
  } catch (error) {
    await inspect({
      error: error.message,
      request: { method, url, options },
      timestamp: new Date().toISOString()
    }, `api-error-${Date.now()}.json`)
    throw error
  }
}
```

### 2. **Data Pipeline Inspection**
```javascript
// Inspect data at each stage of processing
async function dataProcessingPipeline(inputData) {
  // Stage 1: Raw data
  await inspect(inputData, "1-raw-input.json")
  
  // Stage 2: Cleaned data
  let cleaned = cleanData(inputData)
  await inspect(cleaned, "2-cleaned.json")
  
  // Stage 3: Transformed data
  let transformed = transformData(cleaned)
  await inspect(transformed, "3-transformed.json")
  
  // Stage 4: Final output
  let final = finalizeData(transformed)
  await inspect(final, "4-final-output.json")
  
  return final
}
```

### 3. **Configuration Debugging**
```javascript
// Debug configuration loading
async function loadConfig() {
  let configs = {
    default: await readJson("config.default.json"),
    user: await readJson(home(".myapp/config.json")).catch(() => ({})),
    env: process.env,
    computed: {}
  }
  
  // Merge configs
  let final = Object.assign({}, 
    configs.default, 
    configs.user,
    { env: configs.env }
  )
  
  // Inspect full configuration state
  await inspect({
    sources: configs,
    final: final,
    loadedAt: new Date().toISOString()
  }, "config-debug.json")
  
  return final
}
```

### 4. **Performance Profiling**
```javascript
// Inspect performance metrics
async function profileOperation(name, operation) {
  let metrics = {
    name,
    started: new Date().toISOString(),
    memory: {
      before: process.memoryUsage()
    }
  }
  
  let startTime = performance.now()
  
  try {
    let result = await operation()
    
    metrics.duration = performance.now() - startTime
    metrics.success = true
    metrics.memory.after = process.memoryUsage()
    metrics.memory.delta = {
      heapUsed: metrics.memory.after.heapUsed - metrics.memory.before.heapUsed
    }
    
    await inspect(metrics, `profile-${name}-${Date.now()}.json`)
    return result
    
  } catch (error) {
    metrics.duration = performance.now() - startTime
    metrics.error = error.message
    metrics.success = false
    
    await inspect(metrics, `profile-error-${name}-${Date.now()}.json`)
    throw error
  }
}
```

## Integration with Other APIs

### With tmpPath()
```javascript
// inspect uses tmpPath internally
let customPath = tmpPath("debug", "data.json")
await writeJson(customPath, data)
await edit(customPath) // Similar to inspect
```

### With dev()
```javascript
// For interactive debugging vs file inspection
dev(data)     // Opens in Chrome DevTools
inspect(data) // Saves to file and opens in editor
```

### With log functions
```javascript
// Combine with logging
console.log("Processing data...")
await inspect(data, "processing-state.json")
```

## Best Practices

### 1. **Use Descriptive Filenames**
```javascript
// Good - describes content
await inspect(userData, "user-profile-data.json")
await inspect(errors, "validation-errors.json")

// Less helpful
await inspect(userData, "data.json")
await inspect(errors, "output.json")
```

### 2. **Clean Up Old Inspections**
```javascript
// Periodically clean inspection files
let inspectionFiles = await globby(tmpPath("*.json"))
let oldFiles = inspectionFiles.filter(file => {
  let stats = statSync(file)
  return Date.now() - stats.mtime > 24 * 60 * 60 * 1000 // 24 hours
})
await trash(oldFiles)
```

### 3. **Group Related Inspections**
```javascript
// Organize inspections by feature
await inspect(loginData, "auth/login-attempt.json")
await inspect(tokenData, "auth/token-generated.json")
await inspect(userData, "auth/user-loaded.json")
```

## Limitations and Considerations

- **Large files**: Very large objects might take time to format and open
- **Circular references**: Handled gracefully with JSON-safe stringify
- **Functions**: Converted to string representations
- **Binary data**: Not suitable for binary formats

## Related APIs

- **dev()** - Interactive debugging in DevTools
- **log()** - Simple console logging
- **tmpPath()** - Where inspect saves files
- **edit()** - Opens files in editor (used by inspect)

## Repomix Command

To generate documentation for the inspect API implementation:

```bash
cd ~/scriptkit && npx @repomix/cli --include "sdk/src/api/kit.ts"
```