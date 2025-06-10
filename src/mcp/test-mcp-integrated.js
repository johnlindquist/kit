#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { readFileSync } from "fs"
// For now, we'll inline simplified versions since we can't import from .ts files directly
// In production, these would be in separate .js modules

// Simple arg placeholder extraction
async function extractArgPlaceholders(code) {
  const placeholders = []
  let argIndex = 0
  
  // Simple regex to find arg calls
  const argRegex = /await\s+arg\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*\{[^}]*placeholder\s*:\s*["'`]([^"'`]+)["'`]/g
  let match
  
  while ((match = argRegex.exec(code)) !== null) {
    argIndex++
    placeholders.push({
      name: `arg${argIndex}`,
      placeholder: match[2]
    })
  }
  
  // Also find args without placeholders
  const simpleArgRegex = /await\s+arg\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*\[[^\]]+\]\s*\)/g
  while ((match = simpleArgRegex.exec(code)) !== null) {
    argIndex++
    placeholders.push({
      name: `arg${argIndex}`,
      placeholder: null
    })
  }
  
  return placeholders
}

// Simple script runner
import { fork } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runScriptWithResult(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const runnerPath = join(__dirname, "../../test-scripts/script-runner.js")
    const child = fork(runnerPath, [scriptPath, ...args], {
      silent: true,
      env: {
        ...process.env,
        KIT_CONTEXT: 'workflow'
      },
      execArgv: []
    })
    
    let output = ''
    let lastLine = ''
    
    child.stdout?.on('data', (data) => {
      const text = data.toString()
      output += text
      const lines = text.trim().split('\n').filter(l => l)
      if (lines.length > 0) {
        lastLine = lines[lines.length - 1]
      }
    })
    
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Script exited with code ${code}`))
      } else {
        try {
          if (lastLine && (lastLine.startsWith('{') || lastLine.startsWith('['))) {
            resolve(JSON.parse(lastLine))
          } else {
            resolve({ output: output.trim() })
          }
        } catch (e) {
          resolve({ output: output.trim() })
        }
      }
    })
  })
}

// Mock scripts with mcp metadata (simulating getScripts)
const mockScripts = [
  {
    command: 'hello-mcp',
    name: 'Hello MCP',
    description: 'A simple test script for MCP',
    filePath: '/workspace/sdk/test-scripts/hello-mcp.js',
    mcp: 'hello'
  },
  {
    command: 'calculator',
    name: 'Calculator',
    description: 'Basic math operations',
    filePath: '/workspace/sdk/test-scripts/calculator.js',
    mcp: 'calculator'
  },
  {
    command: 'no-mcp-script',
    name: 'No MCP Script',
    description: 'This script is not exposed via MCP',
    filePath: '/workspace/sdk/test-scripts/other.js'
    // No mcp field
  }
]

// Create tool schema from placeholders
function createToolSchema(placeholders) {
  const properties = {}
  
  placeholders.forEach((placeholder) => {
    properties[placeholder.name] = z.string().describe(
      placeholder.placeholder || `Enter ${placeholder.name}`
    )
  })
  
  return z.object(properties)
}

async function main() {
  // Create MCP server
  const server = new McpServer({
    name: "script-kit-mcp-test",
    version: "1.0.0"
  })
  
  console.error("Script Kit MCP Test Server starting...")
  
  // Filter MCP-enabled scripts
  const mcpScripts = mockScripts.filter(script => script.mcp)
  console.error(`Found ${mcpScripts.length} MCP-enabled scripts`)
  
  // Process each MCP script
  for (const script of mcpScripts) {
    try {
      // Read script content
      const content = readFileSync(script.filePath, 'utf-8')
      
      // Extract placeholders
      const placeholders = await extractArgPlaceholders(content)
      
      // Create schema
      const schema = createToolSchema(placeholders)
      
      // Register tool
      server.tool(
        script.mcp,
        script.description,
        schema.shape,
        async (params) => {
          console.error(`Running tool: ${script.mcp} with params:`, params)
          
          // Convert parameters to args array
          const args = placeholders.map(p => params[p.name] || '')
          
          try {
            const result = await runScriptWithResult(script.filePath, args)
            console.error(`Result:`, result)
            
            return {
              content: [{
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
              }]
            }
          } catch (error) {
            console.error(`Error:`, error)
            return {
              content: [{
                type: 'text',
                text: `Error running script: ${error.message}`
              }]
            }
          }
        }
      )
      
      console.error(`Registered tool: ${script.mcp} (${script.name})`)
    } catch (error) {
      console.error(`Failed to process script ${script.filePath}:`, error)
    }
  }
  
  // Connect to stdio transport
  const transport = new StdioServerTransport()
  await server.connect(transport)
  
  console.error("Script Kit MCP Test Server is running")
}

// Run the server
main().catch(error => {
  console.error("Failed to start server:", error)
  process.exit(1)
})