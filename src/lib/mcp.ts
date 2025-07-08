import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket';
import type { Transport as MCPTransport } from '@modelcontextprotocol/sdk/shared/transport';
import type { Tool, CallToolRequest, CallToolResult, ListResourcesResult, ListPromptsResult } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { EventEmitter } from 'events';

// Export types for global usage
export type { Tool as MCPTool, CallToolResult as MCPToolResult } from '@modelcontextprotocol/sdk/types';

// MCP Transport types
export type MCPTransportType = 'sse' | 'stdio' | 'websocket' | 'custom';

export interface SSETransportOptions {
    type: 'sse';
    url: string;
    headers?: Record<string, string>;
}

export interface StdioTransportOptions {
    type: 'stdio';
    command: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
}

export interface WebSocketTransportOptions {
    type: 'websocket';
    url: string;
}

export interface CustomTransportOptions {
    type: 'custom';
    transport: MCPTransport;
}

export type MCPTransportOptions = SSETransportOptions | StdioTransportOptions | WebSocketTransportOptions | CustomTransportOptions;

// MCP Options
export interface MCPOptions {
    name?: string;
    version?: string;
}

// Tool options for filtering and schema definition
export interface ToolOptions {
    // Filter tools by name patterns
    include?: string[];
    exclude?: string[];
    // Define schemas for specific tools
    schemas?: Record<string, {
        inputSchema: z.ZodType<any>;
        description?: string;
    }>;
}

// MCP Instance interface
export interface MCPInstance {
    connect: (transport: MCPTransportOptions) => Promise<void>;
    disconnect: () => Promise<void>;
    tools: (options?: ToolOptions) => Promise<Record<string, Tool>>;
    resources: () => Promise<ListResourcesResult['resources']>;
    prompts: () => Promise<ListPromptsResult['prompts']>;
    call: (toolName: string, args: any) => Promise<any>;
    get isConnected(): boolean;
    on: (event: string, listener: (...args: any[]) => void) => void;
    off: (event: string, listener: (...args: any[]) => void) => void;
}

// MCP Observability events
export interface MCPObservabilityEvents {
    'mcp:connect:start': { transport: MCPTransportOptions };
    'mcp:connect:complete': { duration: number };
    'mcp:connect:error': { error: Error; duration: number };
    'mcp:disconnect': void;
    'mcp:tool:call:start': { toolName: string; args: any };
    'mcp:tool:call:complete': { toolName: string; result: any; duration: number };
    'mcp:tool:call:error': { toolName: string; error: Error; duration: number };
    'mcp:tools:fetch:start': void;
    'mcp:tools:fetch:complete': { count: number; duration: number };
    'mcp:resources:fetch:start': void;
    'mcp:resources:fetch:complete': { count: number; duration: number };
    'mcp:prompts:fetch:start': void;
    'mcp:prompts:fetch:complete': { count: number; duration: number };
}

// Global event emitter for MCP observability
export const mcpObservability = new EventEmitter();

// Create transport based on options
async function createTransport(options: MCPTransportOptions): Promise<MCPTransport> {
    switch (options.type) {
        case 'sse':
            return new SSEClientTransport(options.url, {
                headers: options.headers
            });
        
        case 'stdio':
            return new StdioClientTransport({
                command: options.command,
                args: options.args || [],
                env: options.env,
                cwd: options.cwd
            });
        
        case 'websocket':
            return new WebSocketClientTransport(options.url as any);
        
        case 'custom':
            return options.transport;
        
        default:
            throw new Error(`Unsupported transport type: ${(options as any).type}`);
    }
}

// Create MCP instance factory
const createMCPInstance = (options: MCPOptions = {}): MCPInstance => {
    let client: MCPClient | null = null;
    let transport: MCPTransport | null = null;
    const eventEmitter = new EventEmitter();
    const { name = 'kit-mcp-client', version = '1.0.0' } = options;

    const connect = async (transportOptions: MCPTransportOptions): Promise<void> => {
        const startTime = Date.now();
        mcpObservability.emit('mcp:connect:start', { transport: transportOptions });

        try {
            // Disconnect if already connected
            if (client && transport) {
                await disconnect();
            }

            // Create transport
            transport = await createTransport(transportOptions);
            
            // Create client
            client = new MCPClient({
                name,
                version
            }, {
                capabilities: {
                    tools: true,
                    resources: true,
                    prompts: true
                }
            });

            // Connect
            await client.connect(transport);

            const duration = Date.now() - startTime;
            mcpObservability.emit('mcp:connect:complete', { duration });
            eventEmitter.emit('connected');
        } catch (error) {
            const duration = Date.now() - startTime;
            const err = error instanceof Error ? error : new Error('Unknown connection error');
            mcpObservability.emit('mcp:connect:error', { error: err, duration });
            throw err;
        }
    };

    const disconnect = async (): Promise<void> => {
        if (client) {
            await client.close();
            client = null;
            transport = null;
            mcpObservability.emit('mcp:disconnect');
            eventEmitter.emit('disconnected');
        }
    };

    const tools = async (options?: ToolOptions): Promise<Record<string, Tool>> => {
        if (!client) {
            throw new Error('MCP client not connected. Call connect() first.');
        }

        const startTime = Date.now();
        mcpObservability.emit('mcp:tools:fetch:start');

        try {
            const result = await client.listTools();
            let toolsMap: Record<string, Tool> = {};

            for (const tool of result.tools) {
                // Apply filters
                if (options?.include && !options.include.some(pattern => tool.name.includes(pattern))) {
                    continue;
                }
                if (options?.exclude && options.exclude.some(pattern => tool.name.includes(pattern))) {
                    continue;
                }

                // Apply schema if provided
                if (options?.schemas && options.schemas[tool.name]) {
                    const schemaConfig = options.schemas[tool.name];
                    toolsMap[tool.name] = {
                        ...tool,
                        description: schemaConfig.description || tool.description,
                        inputSchema: tool.inputSchema // Keep original schema for now
                    };
                } else {
                    toolsMap[tool.name] = tool;
                }
            }

            const duration = Date.now() - startTime;
            mcpObservability.emit('mcp:tools:fetch:complete', { count: Object.keys(toolsMap).length, duration });
            
            return toolsMap;
        } catch (error) {
            throw new Error(`Failed to fetch MCP tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const resources = async (): Promise<ListResourcesResult['resources']> => {
        if (!client) {
            throw new Error('MCP client not connected. Call connect() first.');
        }

        const startTime = Date.now();
        mcpObservability.emit('mcp:resources:fetch:start');

        try {
            const result = await client.listResources();
            const duration = Date.now() - startTime;
            mcpObservability.emit('mcp:resources:fetch:complete', { count: result.resources.length, duration });
            return result.resources;
        } catch (error) {
            throw new Error(`Failed to fetch MCP resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const prompts = async (): Promise<ListPromptsResult['prompts']> => {
        if (!client) {
            throw new Error('MCP client not connected. Call connect() first.');
        }

        const startTime = Date.now();
        mcpObservability.emit('mcp:prompts:fetch:start');

        try {
            const result = await client.listPrompts();
            const duration = Date.now() - startTime;
            mcpObservability.emit('mcp:prompts:fetch:complete', { count: result.prompts.length, duration });
            return result.prompts;
        } catch (error) {
            throw new Error(`Failed to fetch MCP prompts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const call = async (toolName: string, args: any): Promise<any> => {
        if (!client) {
            throw new Error('MCP client not connected. Call connect() first.');
        }

        const startTime = Date.now();
        mcpObservability.emit('mcp:tool:call:start', { toolName, args });

        try {
            const request: CallToolRequest = {
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: args
                }
            };

            const result = await client.callTool(request.params);
            const duration = Date.now() - startTime;
            mcpObservability.emit('mcp:tool:call:complete', { toolName, result, duration });
            
            // Extract content from result
            if (result.content && Array.isArray(result.content) && result.content.length > 0) {
                // If single text content, return just the text
                if (result.content.length === 1 && result.content[0].type === 'text') {
                    return result.content[0].text;
                }
                // Otherwise return the full content array
                return result.content;
            }
            
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            const err = error instanceof Error ? error : new Error('Tool execution failed');
            mcpObservability.emit('mcp:tool:call:error', { toolName, error: err, duration });
            throw err;
        }
    };

    return {
        connect,
        disconnect,
        tools,
        resources,
        prompts,
        call,
        get isConnected() {
            return client !== null && transport !== null;
        },
        on: (event: string, listener: (...args: any[]) => void) => {
            eventEmitter.on(event, listener);
        },
        off: (event: string, listener: (...args: any[]) => void) => {
            eventEmitter.off(event, listener);
        }
    };
};

// Global MCP factory function
global.mcp = createMCPInstance;

// Export for testing and advanced usage
export { createMCPInstance };