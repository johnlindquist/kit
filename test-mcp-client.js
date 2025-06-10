#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { spawn } from 'child_process'

async function main() {
  // Create transport with our MCP server
  const mcpProcess = spawn('/home/node/.kit/bin/mcp', [], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PATH: process.env.PATH
    }
  })

  const transport = new StdioClientTransport({
    command: '/home/node/.kit/bin/mcp',
    args: []
  })

  // Create client
  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  })

  // Connect
  await client.connect(transport)
  console.log('Connected to MCP server')

  // List tools
  const tools = await client.listTools()
  console.log('Available tools:', JSON.stringify(tools, null, 2))

  // Call the add-numbers tool
  if (tools.tools.find(t => t.name === 'add-numbers')) {
    console.log('\nCalling add-numbers tool with 5 + 3...')
    const result = await client.callTool('add-numbers', {
      arg1: '5',
      arg2: '3'
    })
    console.log('Result:', JSON.stringify(result, null, 2))
  }

  // Close connection
  await client.close()
  process.exit(0)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})