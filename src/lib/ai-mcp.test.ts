// @ts-nocheck - AI SDK v5 beta has type issues that need to be resolved
import test from 'ava'
import './ai.js' // Import AI functionality
import { tool } from 'ai'
import { config } from 'dotenv'
import { resolve } from 'path'
import { z } from 'zod'

// Load environment variables from .kenv/.env
config({ path: resolve(process.env.HOME, '.kenv', '.env') })

test.skip('global.ai works with MCP tools', async (t) => {
    // Create mock tools
    const toolExecuted = { called: false, args: null, result: null }
    
    const tools = {
        'search_memories': tool({
            description: 'Search for saved memories',
            inputSchema: z.object({
                query: z.string().describe('The search query')
            }),
            execute: async (args: { query: string }) => {
                toolExecuted.called = true
                toolExecuted.args = args
                toolExecuted.result = {
                    memories: [`Memory 1 about ${args.query}`, `Memory 2 about ${args.query}`, `Memory 3 about ${args.query}`]
                }
                return toolExecuted.result
            }
        } as any) // Type assertion needed due to AI SDK v5 beta type issues
    }

    // Check if global.ai exists
    t.truthy(global.ai, 'global.ai should exist')
    
    // Create AI function with tools
    const searchAI = global.ai(
        'You are a helpful assistant that searches memories. When asked to find something, use the search_memories tool and then provide a summary of what you found.',
        {
            tools,
            autoExecuteTools: true,
            model: 'gpt-3.5-turbo',
            maxSteps: 3 // Ensure enough steps for tool call + response
        }
    )
    
    t.is(typeof searchAI, 'function', 'ai() should return a function')
    
    // Skip if no API key
    if (!process.env.OPENAI_API_KEY) {
        t.pass('Skipping - OPENAI_API_KEY not available')
        return
    }
    
    // Test with a query that should trigger tool use
    let response
    try {
        response = await searchAI('Find my memories about TypeScript')
    } catch (error) {
        t.log('Error:', error)
        throw error
    }
    
    // Log for debugging
    t.log('Tool executed:', toolExecuted)
    t.log('Response:', response)
    
    t.true(toolExecuted.called, 'Tool should have been called')
    t.truthy(toolExecuted.args, 'Tool should have received arguments')
    t.truthy(response, 'Should get a response')
    t.true(response.length > 0, 'Response should not be empty')
})

test('global.assistant works with MCP tools', async (t) => {
    // Create mock tools
    const toolExecuted = { called: false, args: null, result: null }
    
    const tools = {
        'search_memories': tool({
            description: 'Search for saved memories',
            inputSchema: z.object({
                query: z.string().describe('The search query')
            }),
            execute: async (args: { query: string }) => {
                toolExecuted.called = true
                toolExecuted.args = args
                toolExecuted.result = {
                    memories: [`Memory 1 about ${args.query}`, `Memory 2 about ${args.query}`, `Memory 3 about ${args.query}`]
                }
                return toolExecuted.result
            }
        } as any) // Type assertion needed due to AI SDK v5 beta type issues
    }

    // Check if global.assistant exists
    t.truthy(global.assistant, 'global.assistant should exist')
    
    // Create assistant with tools
    const assistant = global.assistant(
        'You are a helpful assistant that searches memories. When asked to find something, use the search_memories tool and then provide a summary of what you found.',
        {
            tools,
            autoExecuteTools: true,
            model: 'gpt-3.5-turbo'
        }
    )
    
    t.is(typeof assistant, 'object', 'assistant() should return an object')
    t.is(typeof assistant.generate, 'function', 'assistant should have generate method')
    
    // Skip if no API key
    if (!process.env.OPENAI_API_KEY) {
        t.pass('Skipping - OPENAI_API_KEY not available')
        return
    }
    
    // Add user message and generate response
    assistant.addUserMessage('Find my memories about TypeScript')
    
    let result
    try {
        result = await assistant.generate()
    } catch (error) {
        t.log('Error:', error)
        throw error
    }
    
    // Log for debugging
    t.log('Tool executed:', toolExecuted)
    t.log('Result:', result)
    
    t.true(toolExecuted.called, 'Tool should have been called')
    t.truthy(toolExecuted.args, 'Tool should have received arguments')
    t.is(result.kind, 'text', 'Result should be text')
    t.truthy(result.text, 'Should get a text response')
    t.true(result.text.length > 0, 'Text response should not be empty')
})

test('global.ai without tools works as before', async (t) => {
    // Create AI function without tools
    const simpleAI = global.ai('You are a helpful assistant.')
    
    t.is(typeof simpleAI, 'function', 'ai() should return a function')
    
    // Skip if no API key
    if (!process.env.OPENAI_API_KEY) {
        t.pass('Skipping - OPENAI_API_KEY not available')
        return
    }
    
    // Test simple query
    const response = await simpleAI('What is 2+2?')
    
    t.truthy(response, 'Should get a response')
    t.true(response.length > 0, 'Response should not be empty')
    t.log('Response:', response)
})