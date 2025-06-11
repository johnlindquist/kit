// Name: MCP Result Example
// Description: Shows how to use MCPToolResult type
// mcp: result-example

// @ts-check

const name = process.argv[2] || 'World'

/** @type {MCPToolResult} */
const result = {
  content: [
    {
      type: 'text',
      text: `Hello, ${name}! This is an MCP tool result.`
    }
  ],
  _meta: {
    timestamp: new Date().toISOString()
  }
}

console.log(JSON.stringify(result))
export default result