#!/usr/bin/env node

// Example: Using MCP with AI SDK v5
// This example demonstrates how to:
// 1. Create an MCP client
// 2. Connect to an MCP server
// 3. Use MCP tools with the AI assistant

import '@johnlindquist/kit';

// Create MCP client instance
const mcpClient = await mcp({
    name: 'example-mcp-client',
    version: '1.0.0'
});

// Connect to an MCP server
// Example 1: Connect via stdio (local process)
await mcpClient.connect({
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-everything']
});

// Example 2: Connect via SSE (remote server)
// await mcpClient.connect({
//     type: 'sse',
//     url: 'https://my-mcp-server.com/sse',
//     headers: {
//         'Authorization': 'Bearer my-api-key'
//     }
// });

// Get available tools from the MCP server
const mcpTools = await mcpClient.tools();
console.log('Available MCP tools:', Object.keys(mcpTools));

// Use MCP tools directly
const weatherResult = await mcpClient.call('get-weather', {
    location: 'San Francisco'
});
console.log('Weather result:', weatherResult);

// Convert MCP tools to AI SDK format for use with assistant
const { convertMCPToolsToAITools } = await import('../src/lib/ai.js');
const aiTools = convertMCPToolsToAITools(mcpTools, mcpClient);

// Create an AI assistant with MCP tools
const assistant = await assistant("You are a helpful assistant with access to various tools.", {
    model: 'gpt-4',
    tools: aiTools,
    autoExecuteTools: true
});

// Add a user message
assistant.addUserMessage("What's the weather like in New York?");

// Generate response (will automatically use MCP tools if needed)
const response = await assistant.generate();

if (response.kind === 'text') {
    console.log('Assistant response:', response.text);
} else if (response.kind === 'toolCalls') {
    console.log('Assistant wants to call tools:', response.calls);
    // If autoExecuteTools is false, you would manually execute tools here
} else if (response.kind === 'error') {
    console.error('Error:', response.error);
}

// Stream responses with MCP tools
console.log('\nStreaming example:');
assistant.addUserMessage("Tell me about the weather in London and calculate 15% tip on $85");

for await (const chunk of assistant.textStream) {
    process.stdout.write(chunk);
}

// Get resources from MCP server
const resources = await mcpClient.resources();
console.log('\n\nAvailable resources:', resources);

// Get prompts from MCP server
const prompts = await mcpClient.prompts();
console.log('Available prompts:', prompts);

// Disconnect when done
await mcpClient.disconnect();

// Example: Using MCP tools with the simple ai() function
console.log('\n\nUsing MCP with ai() function:');

// First, create a wrapper that includes MCP context
const aiWithMCP = ai("You are a helpful assistant. Use the available tools to answer questions.", {
    tools: aiTools
});

const simpleResponse = await aiWithMCP("What's 25% of 120?");
console.log('AI response:', simpleResponse);

// Example: Generate structured data with MCP context
const schema = z.object({
    location: z.string(),
    temperature: z.number(),
    conditions: z.string(),
    recommendation: z.string()
});

const weatherReport = await generate(
    "Get the weather for Miami and provide a recommendation for outdoor activities",
    schema,
    {
        tools: aiTools
    }
);

console.log('Structured weather report:', weatherReport);