import ava from 'ava'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Helper to run MCP server with test scripts
async function runMcpServerWithTestScript(t: any, scriptName: string, args: string[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    const mcpServerPath = path.join(__dirname, 'mcp-server.js')
    const testScriptsDir = path.join(__dirname, '..', '..', 'test-scripts')
    
    // Set up environment
    const env = {
      ...process.env,
      KENV: testScriptsDir,
      KIT: path.join(process.env.HOME || '', '.kit'),
      KIT_CONTEXT: 'workflow'
    }

    // Start MCP server
    const server = spawn('node', [mcpServerPath], {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    server.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    server.stderr?.on('data', (data) => {
      stderr += data.toString()
      t.log('MCP Server stderr:', data.toString())
    })

    // Wait for server to be ready
    setTimeout(() => {
      // Send tool call with args array
      const toolCall = {
        method: 'tool/call',
        params: {
          name: scriptName,
          arguments: {
            args: args
          }
        }
      }

      server.stdin?.write(JSON.stringify(toolCall) + '\n')
    }, 1000)

    server.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`MCP server exited with code ${code}: ${stderr}`))
      } else {
        try {
          // Parse stdout for response
          const lines = stdout.split('\n')
          const responseLine = lines.find(line => line.includes('"result"'))
          if (responseLine) {
            resolve(JSON.parse(responseLine))
          } else {
            resolve({ stdout, stderr })
          }
        } catch (e) {
          resolve({ stdout, stderr })
        }
      }
    })

    server.on('error', reject)

    // Timeout after 5 seconds
    setTimeout(() => {
      server.kill()
      reject(new Error('MCP server timeout'))
    }, 5000)
  })
}

// Test 1: Export default with object
ava('MCP server handles export default with object', async (t) => {
  const result = await runMcpServerWithTestScript(t, 'export-default', [])
  
  t.truthy(result)
  t.is(result.type, 'export-default')
  t.is(result.message, 'Hello from export default')
  t.truthy(result.timestamp)
})

// Test 2: Console.log JSON output
ava('MCP server handles console.log JSON output', async (t) => {
  const result = await runMcpServerWithTestScript(t, 'export-console', [])
  
  t.truthy(result)
  t.is(result.type, 'console-json')
  t.is(result.message, 'Hello from console.log JSON')
  t.truthy(result.timestamp)
})

// Test 3: Plain text export
ava('MCP server handles plain text export', async (t) => {
  const result = await runMcpServerWithTestScript(t, 'plain-text', [])
  
  t.truthy(result)
  // Plain text should be wrapped in an object
  if (typeof result === 'object' && result.output) {
    t.is(result.output, 'This is plain text output without JSON')
  } else {
    t.is(result, 'This is plain text output without JSON')
  }
})

// Test 4: Script with args
ava('MCP server handles scripts with args', async (t) => {
  const result = await runMcpServerWithTestScript(t, 'greet-user', ['Alice'])
  
  t.truthy(result)
  t.is(result.name, 'Alice')
  t.is(result.greeting, 'Hello, Alice!')
  t.truthy(result.timestamp)
})

// Test 5: Calculator with multiple args
ava('MCP server handles calculator with multiple args', async (t) => {
  const result = await runMcpServerWithTestScript(t, 'calc', ['10', '+', '5'])
  
  t.truthy(result)
  t.is(result.result, 15)
  t.is(result.operationName, 'addition')
  t.is(result.expression, '10 + 5 = 15')
})

// Test 6: Error handling
ava('MCP server handles script errors gracefully', async (t) => {
  const result = await runMcpServerWithTestScript(t, 'error-test', ['yes'])
  
  t.truthy(result)
  // Should contain error information
  if (result.error || (result.content && result.content[0]?.text?.includes('Error'))) {
    t.pass('Error was properly handled')
  } else {
    t.fail('Error was not properly handled')
  }
})

// Test 7: Script returns successfully when no error
ava('MCP server handles successful execution when no error', async (t) => {
  const result = await runMcpServerWithTestScript(t, 'error-test', ['no'])
  
  t.truthy(result)
  t.is(result.message, 'No error thrown')
  t.is(result.shouldError, 'no')
})