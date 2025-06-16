# Script Kit Tool API Design Summary

## Current Implementation

Script Kit's `tool()` function differs from the official MCP SDK pattern:

### Official MCP SDK Pattern
```typescript
// Server registers tool with handler
server.tool("add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);
```

### Script Kit Pattern
```typescript
// Script receives parameters
const result = await tool({
  name: "add-tool",
  parameters: {
    a: { type: "number" },
    b: { type: "number" }
  }
} as MCPTool);

// Script does work with parameters
const sum = result.a + result.b;

// Script sends response
const response: MCPToolResult = {
  content: [{ type: "text", text: String(sum) }]
};
await sendResponse(response);
```

## Key Differences

1. **Execution Model**
   - MCP SDK: Server-based with registered handlers
   - Script Kit: Script-based with parameter injection

2. **Return Pattern**
   - MCP SDK: Handler returns `{ content: [...] }`
   - Script Kit: `tool()` returns parameters, `sendResponse()` sends result

3. **Parameter Sources** (Script Kit)
   - MCP headers (`X-MCP-Tool`, `X-MCP-Parameters`)
   - Environment variable (`KIT_MCP_CALL`)
   - CLI flags (`--param value`)
   - Interactive prompts (fallback)

## Arg Parsing Comparison

### Sequential Args (Traditional Script Kit)
```bash
kit my-script.js "John Doe" 30 true
```
```typescript
const name = await arg("Enter name")   // "John Doe"
const age = await arg("Enter age")     // "30"
const active = await arg("Active?")    // "true"
```

### Flag-based Args (tool() function)
```bash
kit my-script.js --name "John Doe" --age 30 --active
```
```typescript
const result = await tool({
  name: "my-tool",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "number" },
      active: { type: "boolean" }
    }
  }
});
// result = { name: "John Doe", age: 30, active: true }
```

## Recommendations

1. **Document the Pattern**: Make it clear that Script Kit's tool pattern is different from MCP SDK
2. **Maintain Consistency**: Keep the current pattern as it fits Script Kit's execution model
3. **Unify Arg Parsing**: Consider a unified approach that supports both sequential and flag-based args
4. **Type Safety**: The current implementation correctly preserves types through generics

## Testing Strategy

Tests have been created to verify:
- Tool registration and parameter extraction
- MCP header parameter passing
- Environment variable parameter passing
- CLI flag parsing with type conversion
- Type preservation and generic support

The implementation is working correctly for Script Kit's unique execution model.