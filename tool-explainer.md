# Script Kit Tool API: A Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Traditional arg() Pattern](#traditional-arg-pattern)
3. [Modern tool() Pattern](#modern-tool-pattern)
4. [When to Use Which?](#when-to-use-which)
5. [MCP Integration](#mcp-integration)
6. [Migration Guide](#migration-guide)
7. [Common Pitfalls](#common-pitfalls)

## Overview

Script Kit provides two primary ways to handle script arguments:
- **`arg()`**: Sequential, interactive argument collection
- **`tool()`**: Structured, schema-based parameter handling

## Traditional arg() Pattern

The `arg()` function is Script Kit's original way of collecting input. It processes arguments sequentially using `args.shift()`.

### Basic Usage

```typescript
// Sequential arguments
// Command: kit my-script.js "John Doe" 30 true

const name = await arg("Enter your name")      // Gets "John Doe"
const age = await arg("Enter your age")        // Gets "30" 
const active = await arg("Are you active?")    // Gets "true"
```

### Interactive Prompts

When no CLI arguments are provided, `arg()` shows interactive prompts:

```typescript
// Command: kit my-script.js (no arguments)

const name = await arg("Enter your name")      // Shows input prompt
const age = await arg({
  placeholder: "Enter your age",
  validate: (value) => {
    const num = parseInt(value)
    if (isNaN(num)) return "Please enter a valid number"
    if (num < 0) return "Age must be positive"
    return true
  }
})

const color = await arg("Favorite color?", ["red", "blue", "green"])  // Shows select menu
```

### Advanced arg() Features

```typescript
// With choices
const option = await arg("Select an option", [
  { name: "Create New", value: "create" },
  { name: "Edit Existing", value: "edit" },
  { name: "Delete", value: "delete", preview: "⚠️ This is permanent!" }
])

// With dynamic choices
const file = await arg("Select a file", async () => {
  const files = await readdir("./")
  return files.filter(f => f.endsWith(".md"))
})

// Secret input
const password = await arg({
  placeholder: "Enter password",
  secret: true
})
```

## Modern tool() Pattern

The `tool()` function provides structured parameter handling with schema validation, designed for MCP (Model Context Protocol) integration.

### Basic Usage

```typescript
// Flag-based arguments
// Command: kit my-script.js --name "John Doe" --age 30 --active

const params = await tool({
  name: "user-info-tool",
  description: "Collect user information",
  inputSchema: {
    type: "object",
    properties: {
      name: { 
        type: "string",
        description: "User's full name"
      },
      age: { 
        type: "number",
        description: "User's age"
      },
      active: { 
        type: "boolean",
        description: "Whether user is active"
      }
    },
    required: ["name", "age"]
  }
})

// params = { name: "John Doe", age: 30, active: true }
```

### Type Safety with tool()

```typescript
// Define the parameter interface
interface UserParams {
  name: string
  age: number
  email?: string
  preferences: {
    theme: "light" | "dark"
    notifications: boolean
  }
}

// Use with type parameter
const params = await tool<UserParams>({
  name: "typed-user-tool",
  description: "Collect typed user data",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "number" },
      email: { type: "string" },
      preferences: {
        type: "object",
        properties: {
          theme: { 
            type: "string",
            enum: ["light", "dark"]
          },
          notifications: { type: "boolean" }
        }
      }
    }
  }
})

// TypeScript knows params.name is string, params.age is number, etc.
```

### MCP Tool Pattern

For MCP integration, combine `tool()` with `sendResponse()`:

```typescript
// MCP tool script
import "@johnlindquist/kit"

const params = await tool({
  name: "calculator",
  description: "Perform calculations",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["add", "subtract", "multiply", "divide"]
      },
      a: { type: "number" },
      b: { type: "number" }
    },
    required: ["operation", "a", "b"]
  }
} as MCPTool)

// Perform the calculation
let result: number
switch (params.operation) {
  case "add": result = params.a + params.b; break
  case "subtract": result = params.a - params.b; break
  case "multiply": result = params.a * params.b; break
  case "divide": result = params.a / params.b; break
}

// Send MCP response
const response: MCPToolResult = {
  content: [{
    type: "text",
    text: `${params.a} ${params.operation} ${params.b} = ${result}`
  }]
}

await sendResponse(response)
```

## When to Use Which?

### Use `arg()` when:
- Building interactive CLI tools
- Collecting input step-by-step
- Creating wizard-like experiences
- Working with simple scripts that need basic input
- Maintaining backward compatibility

### Use `tool()` when:
- Building MCP-compatible tools
- Needing structured, validated parameters
- Working with complex nested data
- Integrating with AI systems
- Building API-like interfaces

## MCP Integration

### How tool() Works with MCP

The `tool()` function checks for parameters in this order:

1. **MCP Headers** (highest priority)
   ```typescript
   // When called via MCP HTTP server
   headers['X-MCP-Tool'] = 'calculator'
   headers['X-MCP-Parameters'] = '{"operation":"add","a":5,"b":3}'
   ```

2. **Environment Variable**
   ```typescript
   // When called via MCP process
   process.env.KIT_MCP_CALL = '{"tool":"calculator","parameters":{...}}'
   ```

3. **CLI Flags**
   ```bash
   kit calculator.js --operation add --a 5 --b 3
   ```

4. **Interactive Prompts** (fallback)
   ```typescript
   // If no parameters provided, prompts based on schema
   ```

### MCP Registration

When you call `tool()`, it automatically registers the tool definition:

```typescript
// This registration happens internally
toolDefinitions.set(config.name, config)
```

This allows MCP clients to discover your tool's capabilities.

## Migration Guide

### Converting from arg() to tool()

**Before (arg pattern):**
```typescript
// my-script.js
const input = await arg("Enter input file")
const output = await arg("Enter output file") 
const format = await arg("Format?", ["json", "yaml", "xml"])
const verbose = await arg("Verbose output?", ["yes", "no"]) === "yes"

// Usage: kit my-script.js input.txt output.txt json yes
```

**After (tool pattern):**
```typescript
// my-script.js
const params = await tool({
  name: "file-converter",
  inputSchema: {
    type: "object",
    properties: {
      input: { type: "string", description: "Input file path" },
      output: { type: "string", description: "Output file path" },
      format: { 
        type: "string", 
        enum: ["json", "yaml", "xml"],
        description: "Output format"
      },
      verbose: { type: "boolean", description: "Enable verbose output" }
    },
    required: ["input", "output", "format"]
  }
})

// Usage: kit my-script.js --input input.txt --output output.txt --format json --verbose
```

### Supporting Both Patterns

You can support both patterns for backward compatibility:

```typescript
// Check if running with flags
const hasFlags = process.argv.some(arg => arg.startsWith('--'))

if (hasFlags) {
  // Use tool() for flag-based input
  const params = await tool({ ... })
  processFiles(params.input, params.output, params.format)
} else {
  // Fall back to arg() for positional arguments
  const input = await arg("Input file")
  const output = await arg("Output file")
  const format = await arg("Format?", ["json", "yaml", "xml"])
  processFiles(input, output, format)
}
```

## Common Pitfalls

### 1. Mixing Positional and Flag Arguments

```typescript
// ❌ Won't work as expected
// Command: kit script.js input.txt --format json

const file = await arg("File?")  // Gets "input.txt"
const params = await tool({...}) // Only sees --format

// ✅ Better approach
const argv = process.argv.slice(2)
const positional = argv.filter(a => !a.startsWith('--'))
const flags = await tool({...})
```

### 2. Boolean Flag Handling

```typescript
// tool() handles these correctly:
// --verbose        → true
// --verbose true   → true  
// --verbose false  → false
// --no-verbose     → false (not yet implemented)

// arg() would see these as strings:
// "true" → "true" (string)
// Need to convert: arg(...) === "true"
```

### 3. Array Parameters

```typescript
// With tool()
const params = await tool({
  inputSchema: {
    properties: {
      tags: { type: "array" }
    }
  }
})
// Usage: --tags "dev,test,prod"
// Result: params.tags = ["dev", "test", "prod"]

// With arg()
const tags = await arg("Tags (comma-separated)")
const tagArray = tags.split(",").map(t => t.trim())
```

### 4. Default Values

```typescript
// tool() applies defaults from schema
const params = await tool({
  inputSchema: {
    properties: {
      port: { 
        type: "number",
        default: 3000  // Applied if not provided
      }
    }
  }
})

// arg() requires manual defaults
const port = await arg("Port?") || "3000"
```

## Best Practices

1. **Use tool() for new MCP-compatible scripts**
2. **Keep arg() for simple, interactive scripts**
3. **Document expected input format in script comments**
4. **Validate input regardless of method used**
5. **Provide helpful descriptions in schemas**
6. **Test with both CLI arguments and interactive mode**

## Summary

- `arg()`: Sequential, interactive, simple
- `tool()`: Structured, validated, MCP-compatible
- Both have their place in Script Kit
- Choose based on your use case, not just what's newer
- Migration is straightforward when needed