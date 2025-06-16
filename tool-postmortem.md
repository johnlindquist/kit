# Tool API Implementation Postmortem

## Executive Summary

This postmortem documents the investigation and testing of Script Kit's `tool()` API implementation, including the discovery and fix of a parsing issue with TypeScript type assertions.

## Timeline

1. **Initial Investigation**: Reviewed `tool()` implementation against official MCP SDK
2. **Issue Discovery**: Found that `tool({...} as MCPTool)` pattern wasn't being parsed correctly
3. **Root Cause**: Parameter extractor wasn't handling TypeScript's `TSAsExpression` AST nodes
4. **Fix Applied**: Enhanced AST traversal to handle both direct calls and type assertions
5. **Testing**: Created comprehensive test suites for both app and SDK

## Technical Details

### The Problem

The MCP parameter extractor was failing to parse this valid pattern:
```typescript
const result = await tool({
  name: "my-tool",
  parameters: { ... }
} as MCPTool);
```

The AST parser was only looking for direct `tool()` calls, not type assertions.

### The Solution

Added handling for `TSAsExpression` nodes in the AST traversal:
```typescript
// Check for type assertions with tool() calls
if (node.type === 'TSAsExpression' && 
    node.expression?.type === 'CallExpression' && 
    node.expression.callee?.name === 'tool') {
  // Extract configuration from within the type assertion
}
```

Also discovered that when the object literal itself has a type assertion:
```typescript
tool({...} as MCPTool)  // The argument is a TSAsExpression
```

This required checking the argument type as well.

## Key Findings

### 1. Script Kit's Unique Pattern

Script Kit's `tool()` API differs fundamentally from the MCP SDK:

**MCP SDK Pattern:**
```typescript
server.tool("name", schema, async (params) => {
  return { content: [...] }  // Handler returns result
})
```

**Script Kit Pattern:**
```typescript
const params = await tool(config)  // Receives parameters
// ... do work ...
await sendResponse(result)         // Separate response step
```

This difference is by design - Script Kit runs scripts as processes, not persistent servers.

### 2. Argument Parsing Divergence

Discovered two distinct patterns in Script Kit:

**Sequential (arg):**
- Uses `args.shift()` to consume arguments in order
- Designed for interactive, wizard-like flows
- Example: `kit script.js "John" 30 true`

**Structured (tool):**
- Parses flags into parameter object
- Designed for API-like interfaces
- Example: `kit script.js --name John --age 30 --active`

### 3. Parameter Priority Chain

The `tool()` function checks parameters in priority order:
1. MCP headers (`X-MCP-Tool`, `X-MCP-Parameters`)
2. Environment variable (`KIT_MCP_CALL`)
3. CLI flags (`--param value`)
4. Interactive prompts (fallback)

This allows the same script to work in multiple contexts.

## Test Coverage

### App Tests (Vitest)
- MCP service parameter extraction
- TypeScript type assertion handling
- Tool configuration parsing

### SDK Tests (AVA)
- Tool registration
- Parameter passing via headers/env/CLI
- Type preservation
- Error handling

## Recommendations

### 1. Documentation
- Created comprehensive `tool-explainer.md` guide
- Clear examples of both `arg()` and `tool()` patterns
- Migration guidance for developers

### 2. Future Improvements
- Consider unified argument parser supporting both patterns
- Add support for `--no-flag` boolean negation
- Enhance type inference for better IDE support

### 3. Backward Compatibility
- Maintain both patterns as they serve different use cases
- `arg()` remains ideal for interactive scripts
- `tool()` is required for MCP integration

## Lessons Learned

1. **AST Parsing Complexity**: TypeScript adds additional node types that must be handled
2. **Pattern Documentation**: Clear examples prevent confusion about different approaches
3. **Test-First Development**: Writing tests revealed the parsing issue immediately
4. **Tool Design Philosophy**: Script Kit's process-based model requires different patterns than server-based tools

## Conclusion

The investigation revealed that Script Kit's `tool()` implementation is well-designed for its execution model. The type assertion parsing issue was a minor bug that's now fixed. The fundamental difference from the MCP SDK pattern is intentional and appropriate for Script Kit's architecture.

Both `arg()` and `tool()` patterns should be maintained as they serve complementary purposes in the Script Kit ecosystem.