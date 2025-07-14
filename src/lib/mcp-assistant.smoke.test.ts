// @ts-nocheck - AI SDK v5 beta has type issues that need to be resolved
import test from 'ava'
import { createMCPInstance } from './mcp.js'
import './ai.js' // Import AI functionality
import { config } from 'dotenv'
import { resolve } from 'path'
import { z } from 'zod'
import { tool } from 'ai'

// Load environment variables from .kenv/.env
config({ path: resolve(process.env.HOME, '.kenv', '.env') })

test('mcp tools work with assistant API', async (t) => {
    // Skip if Pieces MCP server is not running
    t.timeout(30000); // 30 second timeout
    
    // Create MCP client
    const client = createMCPInstance({
        name: "pieces"
    })

    try {
        // Connect to Pieces MCP server
        await client.connect({
            type: "sse",
            url: "http://localhost:39300/model_context_protocol/2024-11-05/sse"
        })
        t.true(client.isConnected, 'MCP client should be connected')

        // Get tools
        const tools = await client.tools()
        t.truthy(tools, 'Should retrieve tools from MCP')
        t.true(Object.keys(tools).length > 0, 'Should have at least one tool')
        
        // Verify tools have execute function
        for (const [toolName, tool] of Object.entries(tools)) {
            t.is(typeof tool.execute, 'function', `Tool ${toolName} should have execute function`)
        }

        // Create assistant with MCP tools
        const pieces = global.assistant('You are a helpful assistant that can search for saved memories using the pieces MCP tools', {
            autoExecuteTools: true,
            tools: tools as any // Type assertion needed due to AI SDK v5 beta type issues
        })

        // Add a user message
        pieces.addUserMessage("Find my memories about using claude-hooks")

        // Collect response
        let response = ''
        let toolCalled = false
        
        // Monitor if any tool is called
        const originalExecute = Object.values(tools)[0].execute
        Object.values(tools).forEach(tool => {
            const originalFn = tool.execute
            tool.execute = async (args) => {
                toolCalled = true
                t.log(`Tool called with args:`, args)
                return originalFn(args)
            }
        })

        // Process stream
        for await (const chunk of pieces.textStream) {
            response += chunk
            t.log('Chunk:', chunk)
        }

        // Generate if not already done
        await pieces.generate()

        // Verify results
        t.true(response.length > 0, 'Should receive a response from assistant')
        t.true(toolCalled, 'Should have called at least one MCP tool')

        // Disconnect
        await client.disconnect()
        t.false(client.isConnected, 'MCP client should be disconnected')

    } catch (error) {
        // If connection fails, skip the test
        if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
            t.pass('Skipping - Pieces MCP server not running')
        } else {
            throw error
        }
    }
})

// Test with Pieces MCP server JSON schema tools
test('mcp json schema tools work with assistant API', async (t) => {
    // Skip if OPENAI_API_KEY is not available
    if (!process.env.OPENAI_API_KEY) {
        t.pass('Skipping - OPENAI_API_KEY not available')
        return
    }

    t.timeout(30000); // 30 second timeout
    
    // Create MCP client
    const client = createMCPInstance({
        name: "pieces-test"
    })

    try {
        // Connect to Pieces MCP server
        await client.connect({
            type: "sse",
            url: "http://localhost:39300/model_context_protocol/2024-11-05/sse"
        })
        t.true(client.isConnected, 'MCP client should be connected')

        // Get tools
        const tools = await client.tools()
        t.truthy(tools, 'Should retrieve tools from MCP')
        t.true(Object.keys(tools).length > 0, 'Should have at least one tool')
        
        // Verify tools have proper inputSchema
        for (const [toolName, tool] of Object.entries(tools)) {
            t.truthy(tool.inputSchema, `Tool ${toolName} should have inputSchema`)
            t.is(typeof tool.execute, 'function', `Tool ${toolName} should have execute function`)
        }

        // Create assistant with MCP tools
        const assistant = global.assistant('You are a helpful assistant that can search for saved memories using the pieces MCP tools. When asked to find memories, use the ask_pieces_ltm tool.', {
            autoExecuteTools: true,
            tools: tools as any, // Type assertion needed due to AI SDK v5 beta type issues
            model: 'gpt-3.5-turbo'
        })

        // Add a user message
        assistant.addUserMessage("Find my memories about using claude-hooks")

        // Generate response
        const outcome = await assistant.generate()
        t.log('Outcome:', outcome)
        
        t.truthy(outcome, 'Should have an outcome')
        if (outcome.kind === 'error') {
            t.fail(`Assistant returned error: ${outcome.error}`)
        } else {
            t.is(outcome.kind, 'text', 'Outcome should be text')
            if (outcome.kind === 'text') {
                t.true(outcome.text.length > 0, 'Should generate a text response')
            }
        }

        // Disconnect
        await client.disconnect()
        t.false(client.isConnected, 'MCP client should be disconnected')

    } catch (error) {
        // If connection fails, skip the test
        if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
            t.pass('Skipping - Pieces MCP server not running')
        } else {
            throw error
        }
    }
})

// Test with mock MCP server to debug the issue
test('assistant calls MCP tools correctly', async (t) => {
    // Skip in CI due to global.mini not being available
    if (process.env.CI) {
        t.pass('Skipping test - global.mini not available in CI')
        return
    }
    
    // Create assistant with mock tool
    const toolExecuted = { called: false, args: null, result: null }
    
    // Create a raw tool object that mimics what MCP tools would provide
    const tools = {
        'search_memories': {
            description: 'Search for saved memories',
            inputSchema: z.object({
                query: z.string().describe('The search query')
            }),
            execute: async (args) => {
                toolExecuted.called = true
                toolExecuted.args = args
                toolExecuted.result = {
                    memories: [`Memory 1 about ${args.query}`, `Memory 2 about ${args.query}`, `Memory 3 about ${args.query}`]
                }
                console.log('Tool executed with args:', args)
                return toolExecuted.result
            }
        }
    }

    // Check if assistant is properly created
    t.truthy(global.assistant, 'global.assistant should exist')
    
    const assistant = global.assistant('You are a helpful assistant that searches memories. When asked to find something, use the search_memories tool.', {
        autoExecuteTools: true,
        tools,
        model: 'gpt-3.5-turbo', // Use a cheaper model for testing
        maxSteps: 5  // Explicitly set maxSteps
    })
    
    t.truthy(assistant, 'assistant should be created')
    t.is(typeof assistant.addUserMessage, 'function', 'assistant should have addUserMessage')
    t.truthy(assistant.textStream, 'assistant should have textStream')

    assistant.addUserMessage("Find my memories about claude-hooks")

    // Use generate approach only
    let outcome
    try {
        outcome = await assistant.generate()
        t.log('Generate outcome:', outcome)
    } catch (error) {
        t.log('Generate error:', error)
        throw error
    }
    
    t.log('Tool executed:', toolExecuted)

    t.true(toolExecuted.called, 'Tool should have been called')
    t.deepEqual(toolExecuted.args, { query: 'claude-hooks' }, 'Tool should receive correct arguments')
    t.truthy(outcome, 'Should have an outcome')
    t.is(outcome.kind, 'text', 'Outcome should be text')
    if (outcome.kind === 'text') {
        t.true(outcome.text.length > 0, 'Should generate a text response')
    }
})

// Simpler test to verify the integration without actual MCP server
test('mcp tools have correct structure for assistant API', async (t) => {
    const client = createMCPInstance({
        name: "test"
    })

    // Mock a simple tool
    const mockTool = {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string' }
            }
        }
    }

    // Manually create the tools structure that would come from client.tools()
    const tools = {
        'test-tool': {
            ...mockTool,
            execute: async (args) => {
                t.deepEqual(args, { query: 'test' }, 'Execute should receive correct args')
                return { result: 'test result' }
            }
        }
    }

    // Verify the structure matches what assistant API expects
    t.is(typeof tools['test-tool'].execute, 'function', 'Tool should have execute function')
    t.is(tools['test-tool'].name, 'test-tool', 'Tool should have name')
    t.is(tools['test-tool'].description, 'A test tool', 'Tool should have description')
    t.truthy(tools['test-tool'].inputSchema, 'Tool should have inputSchema')

    // Test execute
    const result = await tools['test-tool'].execute({ query: 'test' })
    t.deepEqual(result, { result: 'test result' }, 'Execute should return expected result')
})