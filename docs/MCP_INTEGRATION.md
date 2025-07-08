# MCP (Model Context Protocol) Integration

This document describes the MCP integration in Kit SDK, which allows you to connect to MCP servers and use their tools with the AI SDK.

## Overview

The Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to LLMs. Kit SDK now includes first-class support for MCP, making it easy to:

- Connect to MCP servers via various transports (SSE, stdio, WebSocket)
- Discover and use tools provided by MCP servers
- Integrate MCP tools seamlessly with AI assistants
- Access resources and prompts from MCP servers

## Basic Usage

### Creating an MCP Client

```javascript
const client = await mcp({
    name: 'my-client',     // Optional: client name
    version: '1.0.0'       // Optional: client version
});
```

### Connecting to MCP Servers

#### Stdio Transport (Local Processes)

```javascript
await client.connect({
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-everything'],
    env: { NODE_ENV: 'production' },  // Optional
    cwd: '/path/to/working/dir'       // Optional
});
```

#### SSE Transport (Remote Servers)

```javascript
await client.connect({
    type: 'sse',
    url: 'https://my-mcp-server.com/sse',
    headers: {
        'Authorization': 'Bearer my-api-key',
        'X-Custom-Header': 'value'
    }
});
```

#### WebSocket Transport

```javascript
await client.connect({
    type: 'websocket',
    url: 'wss://my-mcp-server.com/mcp'
});
```

### Using MCP Tools

#### Direct Tool Usage

```javascript
// Get available tools
const tools = await client.tools();
console.log('Available tools:', Object.keys(tools));

// Call a tool directly
const result = await client.call('get-weather', {
    location: 'New York'
});
```

#### Tool Filtering

```javascript
// Include only specific tools
const weatherTools = await client.tools({
    include: ['weather', 'forecast']
});

// Exclude certain tools
const safeTools = await client.tools({
    exclude: ['admin', 'delete']
});
```

#### Custom Tool Schemas

```javascript
const tools = await client.tools({
    schemas: {
        'get-weather': {
            inputSchema: z.object({
                location: z.string().describe('City name'),
                units: z.enum(['celsius', 'fahrenheit']).optional()
            }),
            description: 'Get current weather for a city'
        }
    }
});
```

## Integration with AI SDK

### Using MCP Tools with Assistant

```javascript
import { convertMCPToolsToAITools } from '@johnlindquist/kit/ai';

// Get MCP tools and convert them
const mcpTools = await client.tools();
const aiTools = convertMCPToolsToAITools(mcpTools, client);

// Create assistant with MCP tools
const assistant = await assistant("You are a helpful assistant", {
    tools: aiTools,
    autoExecuteTools: true
});

// The assistant can now use MCP tools automatically
assistant.addUserMessage("What's the weather in London?");
const response = await assistant.generate();
```

### Using MCP Tools with ai() Function

```javascript
const aiWithTools = ai("You are a helpful assistant", {
    tools: aiTools
});

const response = await aiWithTools("Calculate 20% tip on $50");
```

### Using MCP Tools with generate() Function

```javascript
const schema = z.object({
    city: z.string(),
    temperature: z.number(),
    conditions: z.string()
});

const weather = await generate(
    "Get weather for Paris",
    schema,
    { tools: aiTools }
);
```

## Resources and Prompts

### Accessing Resources

```javascript
const resources = await client.resources();
// Returns array of { uri: string, name: string, description?: string }
```

### Accessing Prompts

```javascript
const prompts = await client.prompts();
// Returns array of { name: string, description?: string, arguments?: any }
```

## Event Handling

```javascript
// Listen for connection events
client.on('connected', () => {
    console.log('Connected to MCP server');
});

client.on('disconnected', () => {
    console.log('Disconnected from MCP server');
});
```

## Observability

The MCP integration emits events for monitoring and debugging:

```javascript
import { mcpObservability } from '@johnlindquist/kit/mcp';

mcpObservability.on('mcp:tool:call:start', ({ toolName, args }) => {
    console.log(`Calling tool ${toolName} with args:`, args);
});

mcpObservability.on('mcp:tool:call:complete', ({ toolName, result, duration }) => {
    console.log(`Tool ${toolName} completed in ${duration}ms`);
});
```

## Best Practices

1. **Connection Management**: Always disconnect when done
   ```javascript
   try {
       await client.connect({ type: 'stdio', command: 'mcp-server' });
       // Use the client...
   } finally {
       await client.disconnect();
   }
   ```

2. **Error Handling**: MCP operations can fail
   ```javascript
   try {
       const result = await client.call('tool-name', args);
   } catch (error) {
       console.error('Tool call failed:', error);
   }
   ```

3. **Tool Discovery**: Check available tools before use
   ```javascript
   const tools = await client.tools();
   if (tools['desired-tool']) {
       // Tool is available
   }
   ```

4. **Type Safety**: Use Zod schemas for tool inputs
   ```javascript
   const schema = z.object({
       query: z.string().min(1)
   });
   
   const validated = schema.parse(userInput);
   await client.call('search', validated);
   ```

## Troubleshooting

### Connection Issues

- Ensure the MCP server is running and accessible
- Check transport-specific requirements (e.g., API keys for SSE)
- Verify command paths for stdio transport

### Tool Execution Errors

- Check tool input requirements in the tool's inputSchema
- Ensure the MCP client is connected before calling tools
- Monitor observability events for detailed error information

### Integration Issues

- Verify AI SDK v5 is properly installed
- Check that MCP tools are correctly converted to AI SDK format
- Ensure proper error handling in tool execute functions