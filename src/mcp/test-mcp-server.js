#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { fork } from "child_process"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Hardcoded test scripts for now
const testScripts = [
  {
    name: "hello-mcp",
    filePath: join(__dirname, "../../test-scripts/hello-mcp.js"),
    placeholders: [
      { name: "name", placeholder: "World" },
      { name: "greeting", placeholder: null }
    ]
  },
  {
    name: "calculator",
    filePath: join(__dirname, "../../test-scripts/calculator.js"),
    placeholders: [
      { name: "num1", placeholder: "10" },
      { name: "num2", placeholder: "5" },
      { name: "operation", placeholder: null }
    ]
  }
]

// Simple script runner
async function runScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    // Use the script runner wrapper
    const runnerPath = join(__dirname, "../../test-scripts/script-runner.js")
    const child = fork(runnerPath, [scriptPath, ...args], {
      silent: true,
      env: {
        ...process.env,
        KIT_CONTEXT: 'workflow'
      },
      execArgv: [] // Clear any node options
    })
    
    let output = ''
    let error = ''
    let lastLine = ''
    
    child.stdout?.on('data', (data) => {
      const text = data.toString()
      output += text
      const lines = text.trim().split('\n').filter(l => l)
      if (lines.length > 0) {
        lastLine = lines[lines.length - 1]
      }
    })
    
    child.stderr?.on('data', (data) => {
      error += data.toString()
    })
    
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Script exited with code ${code}: ${error}`))
      } else {
        // Try to parse the last line as JSON
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
    
    child.on('error', (err) => {
      reject(err)
    })
  })
}

// Create MCP server
const server = new McpServer({
  name: "script-kit-test-mcp",
  version: "1.0.0"
})

// Log to stderr for debugging
console.error("Starting Script Kit Test MCP Server...")

// Register test scripts as tools
for (const script of testScripts) {
  const properties = {}
  
  script.placeholders.forEach((placeholder) => {
    properties[placeholder.name] = z.string().describe(
      placeholder.placeholder || `Enter ${placeholder.name}`
    )
  })
  
  const schema = z.object(properties)
  
  server.tool(
    script.name,
    `Run the ${script.name} script`,
    schema._def.shape(),
    async (params) => {
      console.error(`Running tool: ${script.name} with params:`, params)
      
      // Convert params to args array
      const args = script.placeholders.map(p => params[p.name] || '')
      
      try {
        const result = await runScript(script.filePath, args)
        console.error(`Result:`, result)
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        }
      } catch (error) {
        console.error(`Error:`, error)
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }]
        }
      }
    }
  )
  
  console.error(`Registered tool: ${script.name}`)
}

// Connect to stdio transport
const transport = new StdioServerTransport()
await server.connect(transport)

console.error("Script Kit Test MCP Server is running")