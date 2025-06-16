import ava from 'ava'
import { tool, toolDefinitions } from './tool.js'
import type { Tool } from '../types/kit'

// Simple test to verify basic functionality
ava('tool() should register tool definition', async (t) => {
  // Clear any existing definitions
  toolDefinitions.clear()
  
  const config: Tool = {
    name: 'test-tool',
    description: 'A test tool',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  }
  
  // Set up MCP headers to avoid prompting
  ;(global as any).headers = {
    'X-MCP-Tool': 'test-tool',
    'X-MCP-Parameters': JSON.stringify({ message: 'test' })
  }
  
  try {
    await tool(config)
    
    // Verify tool was registered
    t.true(toolDefinitions.has('test-tool'))
    t.deepEqual(toolDefinitions.get('test-tool'), config)
  } finally {
    // Clean up
    delete (global as any).headers
    toolDefinitions.clear()
  }
})

ava('tool() should return parameters from MCP headers', async (t) => {
  const expectedParams = {
    text: 'Hello from MCP',
    number: 42
  }
  
  // Set up MCP headers
  ;(global as any).headers = {
    'X-MCP-Tool': 'mcp-test-tool',
    'X-MCP-Parameters': JSON.stringify(expectedParams)
  }
  
  const config: Tool = {
    name: 'mcp-test-tool',
    description: 'Test MCP tool'
  }
  
  try {
    const result = await tool(config)
    t.deepEqual(result, expectedParams)
  } finally {
    delete (global as any).headers
    toolDefinitions.clear()
  }
})

ava('tool() should throw error when name is missing', async (t) => {
  const config: Tool = {
    name: '',
    description: 'Invalid tool'
  }
  
  // Provide parameters to avoid prompting
  ;(global as any).headers = {
    'X-MCP-Tool': '',
    'X-MCP-Parameters': JSON.stringify({})
  }
  
  try {
    const error = await t.throwsAsync(async () => {
      await tool(config)
    })
    
    t.regex(error?.message || '', /requires a name/i)
  } finally {
    delete (global as any).headers
  }
})