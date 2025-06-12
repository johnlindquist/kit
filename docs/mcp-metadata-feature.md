# MCP Metadata Feature

## Overview

The MCP (Model Context Protocol) metadata feature allows Script Kit scripts to be exposed as tools through the Script Kit Electron app's built-in MCP server, making them accessible to AI assistants and other MCP-compatible clients.

## Usage

To expose a script as an MCP tool, add the `mcp` metadata field to your script:

```javascript
// Name: Calculator Tool
// Description: Performs basic math operations
// mcp: calculator

const num1 = await arg("First number", { placeholder: "10" })
const num2 = await arg("Second number", { placeholder: "5" })
const operation = await arg("Operation", ["add", "subtract", "multiply", "divide"])

// ... script logic ...

export default { result }
```

## Metadata Syntax

The `mcp` field can be used in two ways:

### 1. Named Tool (Recommended)
```javascript
// mcp: my-tool-name
```
This creates a tool with the specified name. The name should be lowercase and use hyphens for spaces.

### 2. Boolean Flag
```javascript
// mcp: true
```
This uses the script's command name as the tool name.

## How It Works

1. **Script Discovery**: When the Script Kit app starts, it calls `getScripts()` to retrieve all scripts
2. **Filtering**: Only scripts with the `mcp` metadata field are exposed as tools through the built-in MCP server
3. **Tool Registration**: Each MCP-enabled script becomes a tool with:
   - **Name**: From the `mcp` value or script command
   - **Description**: From the script's `description` metadata
   - **Parameters**: Extracted from `arg()` calls with placeholders

## Example Scripts

### Simple Greeting Tool
```javascript
// Name: Greeting Bot
// Description: Generates personalized greetings
// mcp: greeter

const name = await arg("Your name", { placeholder: "World" })
const style = await arg("Greeting style", ["Formal", "Casual", "Funny"])

let greeting
switch(style) {
  case "Formal": greeting = `Good day, ${name}.`; break
  case "Casual": greeting = `Hey ${name}!`; break
  case "Funny": greeting = `Yo yo yo, ${name} in the house!`; break
}

export default { greeting, timestamp: new Date() }
```

### Data Processor Tool
```javascript
// Name: JSON Formatter
// Description: Formats and validates JSON data
// mcp: json-formatter

const jsonData = await arg("Paste JSON data", { placeholder: '{"example": "data"}' })

try {
  const parsed = JSON.parse(jsonData)
  const formatted = JSON.stringify(parsed, null, 2)
  
  export default { 
    valid: true, 
    formatted,
    keys: Object.keys(parsed),
    type: Array.isArray(parsed) ? 'array' : 'object'
  }
} catch (error) {
  export default { 
    valid: false, 
    error: error.message 
  }
}
```

## Testing MCP Tools

### Using MCP Inspector CLI

1. List available tools:
```bash
npx @modelcontextprotocol/inspector --cli node path/to/mcp-server.js --method tools/list
```

2. Call a tool:
```bash
npx @modelcontextprotocol/inspector --cli node path/to/mcp-server.js \
  --method tools/call \
  --tool-name calculator \
  --tool-arg arg1=10 \
  --tool-arg arg2=5 \
  --tool-arg arg3=multiply
```

### Using MCP Inspector UI

```bash
npx @modelcontextprotocol/inspector node path/to/mcp-server.js
```

This opens a web interface at http://localhost:6274 for interactive testing.

## Integration with AI Assistants

Once your scripts are exposed via MCP, they can be used by:
- Claude Desktop (via MCP configuration)
- Other MCP-compatible AI assistants
- Custom applications using the MCP protocol

## Best Practices

1. **Clear Tool Names**: Use descriptive, lowercase names with hyphens
2. **Helpful Descriptions**: Write clear descriptions explaining what the tool does
3. **Placeholder Text**: Provide example values in arg placeholders
4. **Structured Output**: Return JSON objects with meaningful property names
5. **Error Handling**: Handle errors gracefully and return error information

## Technical Details

### Implementation
- Added `mcp?: string | boolean` to the Metadata interface
- Added "mcp" to VALID_METADATA_KEYS_SET in utils.ts
- MCP server filters scripts using `script.mcp` property
- Arg placeholders are extracted to create tool parameter schemas

### Testing
- Metadata parsing: `src/core/mcp-metadata.test.ts`
- Integration tests: `src/mcp/mcp-getscripts-integration.test.ts`
- Server implementation: `src/mcp/test-mcp-integrated.js`

## Future Enhancements

1. **Parameter Types**: Support for non-string parameter types
2. **Resource Exposure**: Expose script outputs as MCP resources
3. **Streaming**: Support for streaming responses
4. **Authentication**: Add auth support for sensitive scripts