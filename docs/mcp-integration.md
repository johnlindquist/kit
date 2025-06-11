# Script Kit MCP (Model Context Protocol) Integration

## Overview

Script Kit now supports the Model Context Protocol (MCP), allowing scripts to be exposed as tools that AI assistants and other MCP clients can use.

## How it Works

### 1. Mark Scripts for MCP

Add the `mcp` metadata to any script you want to expose via MCP:

```typescript
// Name: My Tool
// Description: Does something useful
// mcp: my-tool-name

import "@johnlindquist/kit"

const result = await doSomething()
export default result
```

### 2. Arguments as Arrays

MCP tools in Script Kit use a single `args` parameter that is an array. Each element in the array corresponds to an `arg()` call in your script:

```typescript
// In your script:
const name = await arg("What's your name?")      // args[0]
const age = await arg("What's your age?")        // args[1]
const city = await arg("What city?")             // args[2]
```

When called via MCP:
```json
{
  "name": "my-tool",
  "arguments": {
    "args": ["John", "25", "New York"]
  }
}
```

### 3. Lazy Arguments

The beauty of this approach is that arguments are optional. If an MCP client doesn't provide all arguments, Script Kit can still prompt for the missing ones when running in an interactive context:

- MCP call with `args: ["John"]` → Script Kit will use "John" for name and prompt for age and city
- MCP call with `args: []` → Script Kit will prompt for all three values
- MCP call with `args: ["John", "25", "New York"]` → No prompts needed

### 4. Response Format

When `mcp` metadata is present, the parser automatically sets `response: true`, which means:
- The script should export a result
- The result will be returned to the MCP client
- The result can be any JSON-serializable value

### 5. MCPToolResult Type

For properly typed MCP tool results, use the `MCPToolResult` type:

```typescript
const result: MCPToolResult = {
  content: [{
    type: 'text',
    text: 'Your response text here'
  }]
}

export default result
```

The `MCPToolResult` type supports multiple content types:
- `text`: Plain text responses
- `image`: Base64-encoded images with MIME type
- `audio`: Base64-encoded audio with MIME type
- `resource`: External resources with URI and optional text or blob data

## Example Scripts

### Simple Tool
```typescript
// Name: URL Shortener
// Description: Shortens a URL
// mcp: shorten-url

import "@johnlindquist/kit"

const url = await arg("Enter URL to shorten")
const shortened = await shortenUrl(url)

export default {
  original: url,
  shortened,
  timestamp: new Date().toISOString()
}
```

### Multi-Argument Tool
```typescript
// Name: Send Email
// Description: Send an email
// mcp: send-email

import "@johnlindquist/kit"

const to = await arg("Recipient email")
const subject = await arg("Email subject")
const body = await arg({
  placeholder: "Email body",
  hint: "Markdown supported"
})

const emailResult = await sendEmail({ to, subject, body })

const result: MCPToolResult = {
  content: [{
    type: 'text',
    text: `Email sent successfully!\nMessage ID: ${emailResult.id}\nSent at: ${new Date().toISOString()}`
  }]
}

export default result
```

## Running the MCP Server

The MCP server is available at `~/.kit/bin/mcp` after building the SDK:

```bash
# Start the MCP server
~/.kit/bin/mcp

# Or set environment variables
KENV=~/my-kenv ~/.kit/bin/mcp
```

## Testing

Use the MCP Inspector to test your tools:

```bash
npx @modelcontextprotocol/inspector ~/.kit/bin/mcp
```

## Integration with AI Assistants

Any MCP-compatible client can now use your Script Kit scripts as tools. The client will:

1. Discover available tools via the `tools/list` method
2. See tool descriptions and parameter schemas
3. Call tools with the `args` array
4. Receive structured responses

This enables powerful integrations where AI assistants can leverage your Script Kit automations!