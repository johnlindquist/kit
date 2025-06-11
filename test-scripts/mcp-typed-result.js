// Name: MCP Typed Result Example
// Description: Demonstrates using the MCPToolResult type
// mcp: typed-result
import "@johnlindquist/kit";
const input = await arg("Enter some text to process");
// Create a properly typed MCP result
const result = {
    content: [
        {
            type: 'text',
            text: `You entered: ${input}`
        },
        {
            type: 'text',
            text: `Character count: ${input.length}`
        }
    ],
    _meta: {
        processedAt: new Date().toISOString(),
        version: '1.0.0'
    }
};
export default result;
//# sourceMappingURL=mcp-typed-result.js.map