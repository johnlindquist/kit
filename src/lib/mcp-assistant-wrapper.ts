// Wrapper for MCP tools with assistant that handles v5 compatibility
import './mcp.js'
import './ai.js'
import type { MCPInstance } from './mcp.js'

export interface MCPAssistantOptions {
    systemPrompt?: string
    model?: string
    autoExecuteTools?: boolean
}

/**
 * Creates an assistant that works with MCP tools in AI SDK v5
 * This is a temporary wrapper to handle v5 compatibility issues
 */
export function createMCPAssistant(
    mcpClient: MCPInstance, 
    options: MCPAssistantOptions = {}
) {
    const {
        systemPrompt = 'You are a helpful assistant with access to MCP tools.',
        model = 'gpt-4o',
        autoExecuteTools = true
    } = options

    return {
        async chat(userMessage: string) {
            // Get tools from MCP
            const tools = await mcpClient.tools()
            
            // For v5, we'll use the ai() function which handles tools better
            const aiFunction = global.ai(systemPrompt, {
                tools,
                model,
                autoExecuteTools,
                maxSteps: 5 // Allow multiple tool calls
            })
            
            // Generate response
            const response = await aiFunction(userMessage)
            
            return response
        },
        
        async stream(userMessage: string) {
            // Get tools from MCP
            const tools = await mcpClient.tools()
            
            // Create assistant for streaming
            const assistant = global.assistant(systemPrompt, {
                tools,
                model,
                autoExecuteTools,
                streamingToolExecution: true
            })
            
            // Add user message
            assistant.addUserMessage(userMessage)
            
            // Return the text stream
            return assistant.textStream
        }
    }
}

// Export for global use
global.createMCPAssistant = createMCPAssistant