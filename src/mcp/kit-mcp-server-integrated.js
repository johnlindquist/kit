#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { readFileSync } from "fs"
import { getScripts } from "../core/db.js"
import { extractArgPlaceholders } from "../core/arg-parser.test.js"
import { runScriptWithResult } from "../core/script-runner.test.js"

// Filter scripts that have mcp metadata
function filterMcpScripts(scripts) {
  return scripts.filter(script => script.mcp)
}

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

// Convert Script to MCP tool info
async function scriptToMcpTool(script) {
  if (!script.mcp) return null
  
  try {
    // Read script content
    const content = readFileSync(script.filePath, 'utf-8')
    
    // Extract placeholders
    const placeholders = await extractArgPlaceholders(content)
    
    // Determine tool name
    const toolName = typeof script.mcp === 'string' ? script.mcp : script.command
    
    return {
      name: toolName,
      description: script.description || `Run the ${script.name} script`,
      script,
      placeholders,
      schema: createToolSchema(placeholders)
    }
  } catch (error) {
    console.error(`Failed to process script ${script.filePath}:`, error)
    return null
  }
}

async function main() {
  // Create MCP server
  const server = new McpServer({
    name: "script-kit-mcp",
    version: "1.0.0"
  })
  
  console.error("Script Kit MCP Server starting...")
  
  // Get all scripts
  const allScripts = await getScripts(false)
  console.error(`Found ${allScripts.length} total scripts`)
  
  // Filter MCP-enabled scripts
  const mcpScripts = filterMcpScripts(allScripts)
  console.error(`Found ${mcpScripts.length} MCP-enabled scripts`)
  
  // Convert scripts to tools
  const tools = []
  for (const script of mcpScripts) {
    const tool = await scriptToMcpTool(script)
    if (tool) {
      tools.push(tool)
    }
  }
  
  console.error(`Processed ${tools.length} MCP tools`)
  
  // Register each tool with the server
  for (const tool of tools) {
    server.tool(
      tool.name,
      tool.description,
      tool.schema.shape,
      async (params) => {
        console.error(`Running tool: ${tool.name} with params:`, params)
        
        // Convert parameters to args array
        const args = tool.placeholders.map(p => params[p.name] || '')
        
        try {
          const result = await runScriptWithResult(tool.script.filePath, args)
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
    
    console.error(`Registered tool: ${tool.name} (${tool.script.name})`)
  }
  
  // Connect to stdio transport
  const transport = new StdioServerTransport()
  await server.connect(transport)
  
  console.error("Script Kit MCP Server is running")
}

// Run the server
main().catch(error => {
  console.error("Failed to start server:", error)
  process.exit(1)
})