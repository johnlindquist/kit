# MCP Inspector Testing Guide

## Overview

This guide demonstrates how to test the Script Kit MCP server using the MCP Inspector CLI.

## Test Setup

### 1. Test Scripts Created

**hello-mcp.js**: A simple greeting script
- Takes a name and greeting type as input
- Returns a personalized greeting with timestamp

**calculator.js**: Basic math operations
- Takes two numbers and an operation
- Supports add, subtract, multiply, divide
- Returns the calculation result

### 2. MCP Server Implementation

**test-mcp-server.js**: A simplified MCP server for testing
- Registers test scripts as MCP tools
- Uses a script runner wrapper to execute scripts
- Handles argument passing and result capture

### 3. Script Runner

**script-runner.js**: Mocks Script Kit globals
- Provides `arg` function that reads from command line
- Handles ES module exports
- Returns results as JSON

## Using the Inspector CLI

### List Available Tools

```bash
npx @modelcontextprotocol/inspector --cli node src/mcp/test-mcp-server.js --method tools/list
```

Output shows all registered tools with their input schemas:
- `hello-mcp`: Requires name and greeting parameters
- `calculator`: Requires num1, num2, and operation parameters

### Call a Tool

**Hello MCP Example:**
```bash
npx @modelcontextprotocol/inspector --cli node src/mcp/test-mcp-server.js \
  --method tools/call \
  --tool-name hello-mcp \
  --tool-arg name=Alice \
  --tool-arg greeting=Hello
```

**Calculator Example:**
```bash
npx @modelcontextprotocol/inspector --cli node src/mcp/test-mcp-server.js \
  --method tools/call \
  --tool-name calculator \
  --tool-arg num1=15 \
  --tool-arg num2=3 \
  --tool-arg operation=multiply
```

## Test Results

### Successful Tests Performed

1. **Tool Listing**: ✓ Both tools listed with correct schemas
2. **Hello MCP**: ✓ Returns greeting with timestamp
3. **Calculator Multiply**: ✓ 15 × 3 = 45
4. **Calculator Divide**: ✓ 100 ÷ 25 = 4

### Response Format

All tool responses return JSON in the MCP content format:
```json
{
  "content": [{
    "type": "text",
    "text": "<JSON result from script>"
  }]
}
```

## Key Findings

1. **ES Module Compatibility**: Scripts must use ES module syntax (`export default`) instead of CommonJS (`module.exports`)
2. **Argument Passing**: The inspector passes tool arguments correctly to the script runner
3. **Result Capture**: JSON results are properly captured and returned
4. **Error Handling**: Errors are caught and returned as text content

## Next Steps

1. **Production Implementation**: Move test functions to production modules
2. **Real Script Discovery**: Implement actual file system scanning
3. **Type Support**: Add support for non-string parameter types
4. **Advanced Features**: Add support for resources and prompts

## Running the Inspector UI

For interactive testing, you can also use the Inspector UI:

```bash
npx @modelcontextprotocol/inspector node src/mcp/test-mcp-server.js
```

This opens a web interface at http://localhost:6274 for visual testing.