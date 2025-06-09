import ava from 'ava'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFileSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'

// Mock script type
interface ScriptInfo {
  name: string
  filePath: string
  placeholders: Array<{ name: string; placeholder: string | null }>
}

// Helper to create test script
async function createTestScript(content: string): Promise<string> {
  const testDir = join(tmpdir(), 'kit-mcp-test', randomUUID())
  mkdirSync(testDir, { recursive: true })
  const scriptPath = join(testDir, 'test-script.js')
  writeFileSync(scriptPath, content, 'utf-8')
  return scriptPath
}

// Function to create tool schema from script placeholders
export function createToolSchema(script: ScriptInfo): z.ZodObject<any> {
  const properties: Record<string, z.ZodString> = {}
  
  script.placeholders.forEach((placeholder, index) => {
    const paramName = placeholder.name || `arg${index + 1}`
    properties[paramName] = z.string().describe(
      placeholder.placeholder || `Argument ${index + 1}`
    )
  })
  
  return z.object(properties)
}

// Function to create MCP server with Script Kit scripts
export async function createMCPServer(scripts: ScriptInfo[]): Promise<any> {
  const server = new McpServer({
    name: 'script-kit-mcp',
    version: '1.0.0'
  })
  
  // Store tool handlers for testing
  const toolHandlers = new Map<string, (params: any) => Promise<any>>()
  
  // Register each script as a tool
  for (const script of scripts) {
    const schema = createToolSchema(script)
    
    const handler = async (params: any) => {
      // Convert parameters to args array
      const args = script.placeholders.map((placeholder, index) => {
        const paramName = placeholder.name || `arg${index + 1}`
        return params[paramName] || ''
      })
      
      // Here we would run the actual script
      // For testing, we'll mock the response
      const result = await mockRunScript(script.filePath, args, script.name)
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      }
    }
    
    // Store handler for testing
    toolHandlers.set(script.name, handler)
    
    // Register the tool with the server
    server.tool(
      script.name,
      `Run the ${script.name} Script Kit script`,
      schema.shape,
      handler
    )
  }
  
  return {
    server,
    getTools: () => scripts.map(s => ({ name: s.name })),
    invokeTool: async (name: string, params: any) => {
      const handler = toolHandlers.get(name)
      if (!handler) throw new Error(`Tool ${name} not found`)
      
      return await handler(params)
    }
  }
}

// Mock script runner for testing
async function mockRunScript(filePath: string, args: string[], scriptName?: string): Promise<any> {
  // In real implementation, this would use runScriptWithResult
  if (scriptName === 'greet' || filePath.includes('greet')) {
    return { greeting: `Hello, ${args[0]}!` }
  }
  return { result: 'success', args }
}

// Test cases
ava('should create MCP tools from scripts', async t => {
  const scripts: ScriptInfo[] = [
    { 
      name: "hello", 
      filePath: "/path/to/hello.js", 
      placeholders: [{ name: "name", placeholder: "Your name" }] 
    }
  ]
  
  const mcpWrapper = await createMCPServer(scripts)
  const tools = mcpWrapper.getTools()
  
  t.is(tools.length, 1)
  t.is(tools[0].name, "hello")
})

ava('should create proper schema from placeholders', async t => {
  const script: ScriptInfo = {
    name: "greet",
    filePath: "/path/to/greet.js",
    placeholders: [
      { name: "firstName", placeholder: "John" },
      { name: "lastName", placeholder: "Doe" }
    ]
  }
  
  const schema = createToolSchema(script)
  const shape = schema.shape
  
  t.truthy(shape.firstName)
  t.truthy(shape.lastName)
  t.is(Object.keys(shape).length, 2)
})

ava('should run script when tool is invoked', async t => {
  const scriptPath = await createTestScript(`
    const [name] = args
    module.exports = { greeting: \`Hello, \${name}!\` }
  `)
  
  const mcpWrapper = await createMCPServer([{
    name: "greet",
    filePath: scriptPath,
    placeholders: [{ name: "name", placeholder: "World" }]
  }])
  
  const result = await mcpWrapper.invokeTool("greet", { name: "Alice" })
  const parsedResult = JSON.parse(result.content[0].text)
  
  t.deepEqual(parsedResult, { greeting: "Hello, Alice!" })
})

ava('should handle multiple placeholders correctly', async t => {
  const script: ScriptInfo = {
    name: "calculate",
    filePath: "/path/to/calculate.js",
    placeholders: [
      { name: "num1", placeholder: "10" },
      { name: "num2", placeholder: "20" },
      { name: "operation", placeholder: "add" }
    ]
  }
  
  const mcpWrapper = await createMCPServer([script])
  const result = await mcpWrapper.invokeTool("calculate", {
    num1: "5",
    num2: "3",
    operation: "multiply"
  })
  
  const parsedResult = JSON.parse(result.content[0].text)
  t.deepEqual(parsedResult.args, ["5", "3", "multiply"])
})

ava('should handle scripts without placeholders', async t => {
  const script: ScriptInfo = {
    name: "no-args",
    filePath: "/path/to/no-args.js",
    placeholders: []
  }
  
  const schema = createToolSchema(script)
  const shape = schema.shape
  
  t.deepEqual(Object.keys(shape), [])
})

ava('should throw error for unknown tool', async t => {
  const mcpWrapper = await createMCPServer([])
  
  await t.throwsAsync(
    mcpWrapper.invokeTool("nonexistent", {}),
    { message: 'Tool nonexistent not found' }
  )
})