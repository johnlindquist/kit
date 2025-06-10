#!/usr/bin/env node

import '@johnlindquist/kit'
import { getScripts } from '../core/db.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { readFile } from 'fs/promises'
import { fork } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Simple version of arg parser for production
async function extractArgPlaceholdersSimple(code: string): Promise<Array<{ name: string, placeholder: string | null }>> {
  const placeholders: Array<{ name: string, placeholder: string | null }> = []
  let argIndex = 0
  
  // Simple regex to find arg calls with placeholders
  const argRegex = /await\s+arg\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*\{[^}]*placeholder\s*:\s*["'`]([^"'`]+)["'`]/g
  let match
  
  while ((match = argRegex.exec(code)) !== null) {
    argIndex++
    placeholders.push({
      name: `arg${argIndex}`,
      placeholder: match[2]
    })
  }
  
  // Also find args without placeholders (with array choices)
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

// Run a script and capture its result
async function runScriptWithResult(scriptPath: string, args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    // Use the Kit script runner
    const runnerPath = path.join(__dirname, 'script-runner-kit.js')
    const child = fork(runnerPath, [scriptPath, ...args], {
      silent: true,
      env: {
        ...process.env,
        KIT_CONTEXT: 'workflow',
        KIT_SCRIPT_PATH: scriptPath
      },
      execArgv: []
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
        try {
          // Try to parse the last line as JSON result
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

// Create tool schema from placeholders
function createToolSchema(placeholders: Array<{ name: string, placeholder: string | null }>) {
  const properties: Record<string, any> = {}
  
  placeholders.forEach((placeholder) => {
    properties[placeholder.name] = z.string().describe(
      placeholder.placeholder || `Enter ${placeholder.name}`
    )
  })
  
  return z.object(properties)
}

async function main() {
  try {
    // Create MCP server
    const server = new McpServer({
      name: 'script-kit-mcp',
      version: '1.0.0'
    })
    
    console.error('Script Kit MCP Server starting...')
    
    // Get all scripts
    const allScripts = await getScripts(false)
    console.error(`Found ${allScripts.length} total scripts`)
    
    // Filter MCP-enabled scripts
    const mcpScripts = allScripts.filter(script => script.mcp)
    console.error(`Found ${mcpScripts.length} MCP-enabled scripts`)
    
    // Process each MCP script
    for (const script of mcpScripts) {
      try {
        // Read script content
        const content = await readFile(script.filePath, 'utf-8')
        
        // Extract placeholders
        const placeholders = await extractArgPlaceholdersSimple(content)
        
        // Determine tool name
        const toolName = typeof script.mcp === 'string' ? script.mcp : script.command
        
        // Create schema
        const schema = createToolSchema(placeholders)
        
        // Register tool
        server.tool(
          toolName,
          script.description || `Run the ${script.name} script`,
          schema.shape,
          async (params) => {
            console.error(`Running tool: ${toolName} with params:`, params)
            
            // Convert parameters to args array
            const args = placeholders.map(p => params[p.name] || '')
            
            try {
              const result = await runScriptWithResult(script.filePath, args)
              console.error(`Result:`, result)
              
              return {
                content: [{
                  type: 'text' as const,
                  text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                }]
              }
            } catch (error: any) {
              console.error(`Error:`, error)
              return {
                content: [{
                  type: 'text' as const,
                  text: `Error running script: ${error.message}`
                }]
              }
            }
          }
        )
        
        console.error(`Registered tool: ${toolName} (${script.name})`)
      } catch (error) {
        console.error(`Failed to process script ${script.filePath}:`, error)
      }
    }
    
    // Connect to stdio transport
    const transport = new StdioServerTransport()
    await server.connect(transport)
    
    console.error('Script Kit MCP Server is running')
  } catch (error) {
    console.error('Failed to start MCP server:', error)
    process.exit(1)
  }
}

// Run the server
main()