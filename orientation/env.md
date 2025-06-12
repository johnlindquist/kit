# Env API Orientation

## Overview
The `env` API manages environment variables with automatic `.env` file persistence and secure input handling.

## Main Function Definition
Located in `/workspace/sdk/src/api/global.ts`:

```typescript
global.env = async (envKey, promptConfig) => {
  // Gets or sets environment variable
  // Persists to .env file
  // Returns the variable value
}
```

## Channel/UI Type
- **UI Type**: `UI.arg` (mini prompt)
- **Channel**: Uses standard prompt channels
- **File Operations**: Writes to `.env` file

## How It Differs from Similar APIs
- **vs `process.env`**: Env persists to file and prompts if missing
- **vs `arg`**: Env specifically handles environment variables
- **vs `password`**: Env auto-detects sensitive variables

## Key Features

### 1. Basic Environment Variable
```javascript
// Get or prompt for env variable
let apiKey = await env("API_KEY")
// If API_KEY exists, returns it
// If not, prompts user and saves to .env
```

### 2. With Description
```javascript
// Custom prompt message
let token = await env("GITHUB_TOKEN", "Enter your GitHub personal access token")
```

### 3. Secret Detection
```javascript
// Automatically masks input for sensitive keys
let secret = await env("AWS_SECRET_KEY")  // Auto-detected as secret
let password = await env("DB_PASSWORD")   // Auto-detected as secret
let apiToken = await env("API_TOKEN")     // Auto-detected as secret
```

### 4. Custom Configuration
```javascript
// Full prompt configuration
let value = await env("CONFIG_VALUE", {
  placeholder: "Enter configuration value",
  hint: "This will be used for...",
  secret: false,  // Override secret detection
  reset: true     // Force re-prompt even if exists
})
```

### 5. Function-based Prompt
```javascript
// Dynamic prompt
let dbUrl = await env("DATABASE_URL", async () => {
  let dbType = await arg("Select database type", ["postgres", "mysql", "sqlite"])
  return mini(`Enter ${dbType} connection string`)
})
```

## Environment Variable Management

### Related Functions
```javascript
// Set env variable directly
await setEnvVar("KEY", "value")

// Get env variable with fallback
let value = await getEnvVar("KEY", "default")

// Toggle boolean env variable
await toggleEnvVar("FEATURE_FLAG", "true")
```

### File Location
- Saves to `~/.kenv/.env` by default
- Script-specific `.env` in script directory
- Automatic `.gitignore` handling

## Auto-Detection Rules
Automatically treats as secret if key contains:
- `KEY`
- `SECRET`
- `TOKEN`
- `PASSWORD`

## Path Expansion
```javascript
// Expands ~ to home directory
let configPath = await env("CONFIG_PATH", "~/config.json")
// Automatically expands to /Users/username/config.json
```

## Integration with Scripts
```javascript
// Access directly after setting
let apiKey = await env("API_KEY")

// Also available via process.env
console.log(process.env.API_KEY)

// And via global.env object
console.log(env.API_KEY)
```

## Best Practices
1. Use descriptive variable names
2. Provide helpful descriptions for prompts
3. Don't commit `.env` files to git
4. Use `reset: true` for configuration scripts
5. Validate sensitive values before use

## Common Use Cases
- API key management
- Database credentials
- Feature flags
- Configuration values
- Service URLs
- User preferences
- Path configurations


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/api/global.ts"
```

This will generate a comprehensive report of all the implementation files for this API.