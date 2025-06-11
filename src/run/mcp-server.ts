#!/usr/bin/env node

import '@johnlindquist/kit'
import { getScripts } from '../core/db.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { readFile } from 'fs/promises'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { promises as fs } from 'fs'
import { extractArgPlaceholders } from '../core/arg-parser.js'
import os from 'os'
import http from 'http'
import { fork } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Check if running on Windows
function isWindows(): boolean {
  return os.platform() === 'win32'
}

// Check if Script Kit app is running
async function isKitRunning(): Promise<boolean> {
  if (isWindows()) {
    // On Windows, check if the app process is running
    // For now, we'll assume it's not running and use HTTP
    return false
  }

  try {
    const kitPath = process.env.KIT || path.join(process.env.HOME || '', '.kit')
    await fs.access(path.join(kitPath, 'kit.sock'))
    return true
  } catch {
    return false
  }
}

// Run a script and capture its result
async function runScriptWithResult(scriptPath: string, args: string[]): Promise<any> {
  const kitRunning = await isKitRunning()

  // First try to run directly with our runner (for development/testing)
  try {
    const result = await runScriptDirect(scriptPath, args)
    if (result !== null) return result
  } catch (e) {
    // Fall through to other methods
  }

  if (isWindows()) {
    // On Windows, use HTTP API if available, otherwise run.txt
    return runScriptViaHttp(scriptPath, args).catch(() => runScriptViaRunTxt(scriptPath, args))
  } else if (kitRunning) {
    // On Mac/Linux, use kar to run the script through the app
    return runScriptViaKar(scriptPath, args)
  } else {
    // Fall back to run.txt method
    return runScriptViaRunTxt(scriptPath, args)
  }
}

// Run script directly with our runner
async function runScriptDirect(scriptPath: string, args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const kitPath = process.env.KIT || path.join(process.env.HOME || '', '.kit')
    const nodePath = process.execPath // Use the current node binary
    const runnerPath = path.join(__dirname, 'simple-runner.mjs')
    
    // Use node directly for simple files
    const child = spawn(nodePath, [
      runnerPath, 
      scriptPath, 
      ...args
    ], {
      env: {
        ...process.env,
        KIT_CONTEXT: 'workflow',
        KIT_SCRIPT_PATH: scriptPath,
        KENV: process.env.KENV || path.dirname(scriptPath),
        KIT: kitPath,
        NODE_NO_WARNINGS: '1'
      }
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('exit', (code) => {
      if (code !== 0) {
        // Try to parse stdout as JSON
        const trimmed = stdout.trim()
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            resolve(JSON.parse(trimmed))
          } catch {
            reject(new Error(`Script exited with code ${code}: ${stderr || stdout}`))
          }
        } else {
          reject(new Error(`Script exited with code ${code}: ${stderr || stdout}`))
        }
      } else {
        // Success but no explicit result - check stdout
        const trimmed = stdout.trim()
        if (trimmed) {
          try {
            resolve(JSON.parse(trimmed))
          } catch {
            resolve({ output: trimmed })
          }
        } else {
          resolve({ success: true })
        }
      }
    })

    child.on('error', (err) => {
      reject(err)
    })
  })
}

// Run script via kar (socket communication)
async function runScriptViaKar(scriptPath: string, args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const kitPath = process.env.KIT || path.join(process.env.HOME || '', '.kit')
    const karPath = path.join(kitPath, 'kar')

    // Extract just the script name from the full path
    const scriptName = path.basename(scriptPath, path.extname(scriptPath))

    const child = spawn(karPath, [scriptName, ...args], {
      env: {
        ...process.env,
        KIT_MCP_RESPONSE: 'true' // Signal that we want the response
      }
    })

    let output = ''
    let error = ''

    child.stdout?.on('data', (data) => {
      output += data.toString()
    })

    child.stderr?.on('data', (data) => {
      error += data.toString()
    })

    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Script exited with code ${code}: ${error}`))
      } else {
        try {
          // Try to parse the output as JSON
          const trimmed = output.trim()
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            resolve(JSON.parse(trimmed))
          } else {
            resolve({ output: trimmed })
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

// Run script via HTTP API (for Windows)
async function runScriptViaHttp(scriptPath: string, args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptName = path.basename(scriptPath, path.extname(scriptPath))
    const port = process.env.KIT_PORT || 5173

    const postData = JSON.stringify({
      args: args
    })

    const options = {
      hostname: 'localhost',
      port: port,
      path: `/${scriptName}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = http.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          resolve({ output: data })
        }
      })
    })

    req.on('error', (e) => {
      reject(new Error(`HTTP request failed: ${e.message}`))
    })

    req.write(postData)
    req.end()
  })
}

// Run script via run.txt (file-based triggering)
async function runScriptViaRunTxt(scriptPath: string, args: string[]): Promise<any> {
  return new Promise(async (resolve, reject) => {
    const kitPath = process.env.KIT || path.join(process.env.HOME || '', '.kit')
    const runTxtPath = path.join(kitPath, 'run.txt')
    const responsePath = path.join(kitPath, 'run-response.json')

    try {
      // Clean up any existing response file
      await fs.unlink(responsePath).catch(() => { })

      // Write script and args to run.txt
      const runCommand = [scriptPath, ...args].join(' ')
      await fs.writeFile(runTxtPath, runCommand)

      // Poll for response file (with timeout)
      const timeout = 30000 // 30 seconds
      const pollInterval = 100 // 100ms
      const startTime = Date.now()

      const checkResponse = async () => {
        try {
          const response = await fs.readFile(responsePath, 'utf-8')
          await fs.unlink(responsePath).catch(() => { })

          try {
            resolve(JSON.parse(response))
          } catch {
            resolve({ output: response })
          }
        } catch (err) {
          if (Date.now() - startTime > timeout) {
            reject(new Error('Script execution timed out'))
          } else {
            setTimeout(checkResponse, pollInterval)
          }
        }
      }

      checkResponse()
    } catch (err) {
      reject(err)
    }
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

        // Extract placeholders using Acorn parser
        const placeholders = await extractArgPlaceholders(content)

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

              // Handle different result formats
              let responseText: string
              if (typeof result === 'string') {
                responseText = result
              } else if (result && typeof result === 'object') {
                // If the result has a body property (from Channel.RESPONSE), use that
                if (result.body) {
                  responseText = typeof result.body === 'string' 
                    ? result.body 
                    : JSON.stringify(result.body, null, 2)
                } else {
                  responseText = JSON.stringify(result, null, 2)
                }
              } else {
                responseText = String(result)
              }

              return {
                content: [{
                  type: 'text',
                  text: responseText
                }]
              }
            } catch (error: any) {
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