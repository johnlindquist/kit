# MCP Optional Arguments Implementation Review

## Overview

This review covers the refactoring of the MCP (Model Context Protocol) server implementation to support optional arguments using a single `args` array parameter, aligning with Script Kit's "lazy args" concept, and the addition of the global `MCPToolResult` type.

## Key Changes

### 1. Refactored Tool Parameters

**Before:**
```typescript
// Individual parameters for each placeholder
{
  "name": "greet-user",
  "arguments": {
    "firstName": "John",
    "lastName": "Doe",
    "greeting": "Hello"
  }
}
```

**After:**
```typescript
// Single args array with optional positional values
{
  "name": "greet-user",
  "arguments": {
    "args": ["John", "Doe", "Hello"]
  }
}
```

### 2. Schema Generation

The `createToolSchema` function was updated to generate a flexible array schema:

```typescript
function createToolSchema(placeholders: Array<{ name: string, placeholder: string | null }>) {
  return z.object({
    args: z.array(z.string().optional()).optional().default([])
  })
}
```

This allows:
- Any number of arguments to be passed
- Arguments can be omitted (resulting in empty string or undefined)
- Missing arguments trigger Script Kit's UI prompts

### 3. Lazy Args Implementation

The implementation now supports Script Kit's lazy args pattern:

```typescript
// In the script:
const name = await arg("What's your name?")      // args[0]
const age = await arg("What's your age?")        // args[1]
const city = await arg("What city?")             // args[2]

// When called via MCP:
// - With args: ["John"] → prompts for age and city
// - With args: ["John", "25"] → prompts only for city
// - With args: ["John", "25", "NYC"] → no prompts
// - With args: [] → prompts for all values
```

### 4. MCPToolResult Type

Added a comprehensive global type for MCP tool results:

```typescript
interface MCPToolResult {
  content: Array<
    | { type: 'text', text: string }
    | { type: 'image', data: string, mimeType: string }
    | { type: 'audio', data: string, mimeType: string }
    | { type: 'resource', resource: { uri: string, mimeType?: string } & ({ text: string } | { blob: string }) }
  >
  _meta?: Record<string, any>
}
```

## Usage Examples

### Basic Script with Typed Result

```typescript
// Name: Text Processor
// Description: Process text with MCP
// mcp: text-processor

import "@johnlindquist/kit"

const input = await arg("Enter text to process")
const action = await arg("Choose action", ["uppercase", "lowercase", "reverse"])

let processed = input
switch (action) {
  case "uppercase":
    processed = input.toUpperCase()
    break
  case "lowercase":
    processed = input.toLowerCase()
    break
  case "reverse":
    processed = input.split('').reverse().join('')
    break
}

const result: MCPToolResult = {
  content: [{
    type: 'text',
    text: `Processed: ${processed}`
  }]
}

export default result
```

### Multi-Content Result

```typescript
// Name: Data Analyzer
// Description: Analyze data and return multiple content types
// mcp: data-analyzer

import "@johnlindquist/kit"

const data = await arg("Enter data to analyze")

const result: MCPToolResult = {
  content: [
    {
      type: 'text',
      text: `Analysis of: ${data}`
    },
    {
      type: 'text',
      text: `Length: ${data.length} characters`
    },
    {
      type: 'resource',
      resource: {
        uri: 'data:text/plain;base64,' + Buffer.from(data).toString('base64'),
        mimeType: 'text/plain',
        text: data
      }
    }
  ],
  _meta: {
    analyzedAt: new Date().toISOString(),
    version: '1.0.0'
  }
}

export default result
```

### MCP Client Usage

```javascript
// Initialize MCP client
const client = new MCPClient()

// Call tool with all arguments
const result1 = await client.callTool('greet-user', {
  args: ['John', 'Doe', 'Hello']
})

// Call with partial arguments (triggers prompts for missing ones)
const result2 = await client.callTool('greet-user', {
  args: ['Jane']  // Will prompt for lastName and greeting
})

// Call with no arguments (all prompts shown)
const result3 = await client.callTool('greet-user', {
  args: []
})
```

## Benefits

1. **Simplified Interface**: Single `args` parameter instead of dynamic parameter names
2. **Flexibility**: Supports variable-length argument lists
3. **Lazy Evaluation**: Missing arguments trigger UI prompts automatically
4. **Type Safety**: Global `MCPToolResult` type ensures consistent responses
5. **Backward Compatible**: Scripts continue to work with Script Kit's existing arg() system

## Potential Improvements

### 1. Enhanced Type Information

Currently, all arguments are strings. Consider supporting typed arguments:

```typescript
interface MCPArgument {
  type: 'string' | 'number' | 'boolean' | 'date'
  value: any
  description?: string
}

// Usage
args: [
  { type: 'string', value: 'John' },
  { type: 'number', value: 25 },
  { type: 'boolean', value: true }
]
```

### 2. Argument Validation

Add validation at the MCP server level:

```typescript
function validateArgs(placeholders: Placeholder[], args: string[]): ValidationResult {
  const errors = []
  placeholders.forEach((placeholder, index) => {
    if (placeholder.required && !args[index]) {
      errors.push(`Missing required argument: ${placeholder.name}`)
    }
    if (placeholder.pattern && !placeholder.pattern.test(args[index])) {
      errors.push(`Invalid format for ${placeholder.name}`)
    }
  })
  return { valid: errors.length === 0, errors }
}
```

### 3. Streaming Support

For long-running operations, support streaming responses:

```typescript
interface MCPStreamingResult extends MCPToolResult {
  stream?: AsyncIterable<MCPToolResult['content'][0]>
}
```

### 4. Better Error Handling

Standardize error responses:

```typescript
interface MCPErrorResult extends MCPToolResult {
  error: {
    code: string
    message: string
    details?: any
  }
}
```

### 5. Metadata Schema

Define common metadata fields:

```typescript
interface MCPMetadata {
  timestamp: string
  duration?: number
  version?: string
  warnings?: string[]
  debug?: Record<string, any>
}
```

### 6. Documentation Generation

Auto-generate OpenAPI/JSON Schema from script metadata:

```typescript
// Auto-generate from script comments
const schema = {
  name: "greet-user",
  description: "Greet a user with custom message",
  parameters: {
    type: "object",
    properties: {
      args: {
        type: "array",
        items: [
          { type: "string", description: "First name" },
          { type: "string", description: "Last name" },
          { type: "string", description: "Greeting message" }
        ]
      }
    }
  }
}
```

## Conclusion

The refactoring to optional arguments successfully aligns MCP tools with Script Kit's lazy args concept, providing a more flexible and intuitive interface. The addition of the `MCPToolResult` type ensures consistent, well-typed responses across all MCP tools.

The implementation is solid and production-ready, with clear paths for future enhancements that could make the system even more powerful while maintaining its simplicity.