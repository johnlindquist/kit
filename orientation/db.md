# db API

## Overview

The `db` API provides a simple, persistent JSON database for storing and retrieving data. It's built on top of [lowdb](https://github.com/typicode/lowdb) and offers an intuitive interface for managing local data with automatic file persistence.

## Function Definition

```typescript
export async function db<T>(
  dataOrKeyOrPath?: DBKeyOrPath<T>,
  data?: DBData<T>,
  fromCache = true
): Promise<DBReturnType<T>>
```

## Location
- **SDK Definition**: `/src/core/db.ts` (line 76)
- **Channel**: No specific channel - direct file system operations
- **UI Type**: None - pure data API

## Function Signatures

### Basic Usage
```typescript
// Auto-named database (uses script name)
let myDb = await db({ todos: [] })

// Named database
let userDb = await db("users", { users: [] })

// Full path
let configDb = await db("/path/to/config.json", { settings: {} })
```

## How It Works

1. **File Location**: 
   - Default: `~/.kenv/db/{name}.json`
   - Script-specific: `~/.kenv/db/_{script-name}.json`
   - Custom path: Anywhere you specify

2. **Initialization**: Creates file with initial data if it doesn't exist

3. **Persistence**: Automatically saves changes to disk

4. **Caching**: Caches database instances for performance

## Key Features

- **Automatic Persistence**: Changes are saved automatically
- **Type Safety**: Full TypeScript support with generics
- **Proxy Magic**: Access data properties directly
- **Atomic Writes**: Safe concurrent access
- **Cache Control**: Option to bypass cache
- **Simple API**: Intuitive property access

## Database Methods

```typescript
// Built-in methods
await db.write()          // Force write to disk
await db.read()           // Force read from disk
await db.clear()          // Delete the database file
await db.reset()          // Reset to initial data

// Access properties
db.data                   // Raw data object
db.dbPath                // Full path to JSON file
```

## Usage Examples

### Basic CRUD Operations

```javascript
// Create database with initial data
let todos = await db("todos", {
  items: [],
  lastId: 0
})

// Create
todos.items.push({
  id: ++todos.lastId,
  text: "Learn Script Kit",
  done: false
})
await todos.write()

// Read
console.log(todos.items)
console.log(todos.lastId)

// Update
todos.items[0].done = true
await todos.write()

// Delete
todos.items = todos.items.filter(t => !t.done)
await todos.write()
```

### Auto-named Database

```javascript
// Database named after your script
let db = await db({ 
  count: 0,
  history: []
})

// Increment counter
db.count++
db.history.push(new Date().toISOString())
await db.write()
```

### Complex Data Structures

```javascript
let appData = await db("app-data", {
  users: {},
  settings: {
    theme: "dark",
    fontSize: 14
  },
  cache: new Map(),
  metadata: {
    version: "1.0.0",
    lastSync: null
  }
})

// Add user
appData.users["user123"] = {
  name: "John Doe",
  email: "john@example.com",
  preferences: {}
}

// Update settings
appData.settings.theme = "light"
appData.metadata.lastSync = Date.now()

await appData.write()
```

### Database with Functions

```javascript
// Initialize with async function
let dynamicDb = await db("dynamic", async () => {
  // Fetch initial data
  let response = await fetch("https://api.example.com/config")
  return await response.json()
})
```

### Working with Arrays

```javascript
// When data is an array, it's wrapped in { items: [] }
let logs = await db("logs", [])

// Access via .items
logs.items.push({
  timestamp: Date.now(),
  message: "Application started"
})

await logs.write()
```

## Store API (Key-Value)

For simple key-value storage, use the `store` API:

```javascript
let cache = await store("cache")

// Set values
await cache.set("user:123", { name: "John" })
await cache.set("session", { token: "abc123" })

// Get values
let user = await cache.get("user:123")
let session = await cache.get("session")

// Delete
await cache.delete("session")

// Check existence
let hasUser = await cache.has("user:123")
```

## Common Patterns

### Configuration Storage
```javascript
let config = await db("config", {
  apiKey: "",
  endpoint: "https://api.example.com",
  retries: 3
})

// Update config
config.apiKey = await env("API_KEY")
await config.write()
```

### User Preferences
```javascript
let prefs = await db("preferences", {
  shortcuts: {},
  recentFiles: [],
  windowSize: { width: 800, height: 600 }
})

// Add recent file
prefs.recentFiles.unshift(filePath)
prefs.recentFiles = prefs.recentFiles.slice(0, 10) // Keep last 10
await prefs.write()
```

### Cache Management
```javascript
let cache = await db("cache", {
  entries: {},
  maxAge: 1000 * 60 * 60 // 1 hour
})

// Add to cache
cache.entries[url] = {
  data: responseData,
  timestamp: Date.now()
}

// Clean old entries
let now = Date.now()
for (let [key, entry] of Object.entries(cache.entries)) {
  if (now - entry.timestamp > cache.maxAge) {
    delete cache.entries[key]
  }
}
await cache.write()
```

## Best Practices

1. **Always await write()** for important data
2. **Initialize with structure** to ensure type safety
3. **Use descriptive names** for databases
4. **Clean up old data** periodically
5. **Handle errors** when reading/writing

## Error Handling

```javascript
try {
  let data = await db("important-data", { value: 0 })
  data.value++
  await data.write()
} catch (error) {
  console.error("Database error:", error)
  // Handle corruption, permissions, etc.
}
```

## Notes

- Databases are stored as JSON files
- Not suitable for large datasets (use SQLite via `sql` for that)
- Concurrent access from multiple scripts should be avoided
- Changes are not automatically synchronized between instances
- The `clear()` method permanently deletes the database file
- File watching is not built-in - changes from external sources won't auto-reload

## Repomix Command

To generate documentation for the db API implementation:

```bash
cd ~/scriptkit && npx @repomix/cli --include "sdk/src/core/db.ts" "sdk/src/api/kit.ts"
```