import ava from 'ava'
import { getScripts } from '../core/db'
import { extractArgPlaceholders } from '../core/arg-parser.test'
import { createToolSchema } from './server.test'
import type { Script } from '../types/core'

// Mock script with mcp metadata
const mockScriptContent = `
// Name: Test Calculator
// Description: A test calculator tool
// mcp: calculator

const num1 = await arg("First number", { placeholder: "10" })
const num2 = await arg("Second number", { placeholder: "5" })
const operation = await arg("Operation", ["add", "subtract", "multiply", "divide"])

let result
if (operation === "add") {
  result = Number(num1) + Number(num2)
} else if (operation === "subtract") {
  result = Number(num1) - Number(num2)
} else if (operation === "multiply") {
  result = Number(num1) * Number(num2)
} else if (operation === "divide") {
  result = Number(num1) / Number(num2)
}

export default { num1, num2, operation, result }
`

// Helper to filter scripts with mcp metadata
export function filterMcpScripts(scripts: Script[]): Script[] {
  return scripts.filter(script => script.mcp)
}

// Helper to convert Script to MCP tool info
export async function scriptToMcpTool(script: Script) {
  if (!script.mcp) return null
  
  // Read script content (in real implementation)
  // For now, we'll use placeholder detection based on the script's metadata
  const placeholders = await extractArgPlaceholders(mockScriptContent)
  
  const toolName = typeof script.mcp === 'string' ? script.mcp : script.command
  
  return {
    name: toolName,
    description: script.description || `Run the ${script.name} script`,
    script,
    placeholders
  }
}

ava('should filter scripts with mcp metadata', t => {
  const scripts: Partial<Script>[] = [
    {
      command: 'calculator',
      name: 'Calculator',
      description: 'Math operations',
      mcp: 'calculator'
    },
    {
      command: 'no-mcp',
      name: 'No MCP',
      description: 'Script without MCP'
    },
    {
      command: 'another-mcp',
      name: 'Another MCP Tool',
      mcp: true
    }
  ]
  
  const mcpScripts = filterMcpScripts(scripts as Script[])
  
  t.is(mcpScripts.length, 2)
  t.is(mcpScripts[0].command, 'calculator')
  t.is(mcpScripts[1].command, 'another-mcp')
})

ava('should convert script to MCP tool info', async t => {
  const script: Partial<Script> = {
    command: 'calculator',
    name: 'Calculator Tool',
    description: 'Performs calculations',
    mcp: 'calc-tool',
    filePath: '/test/calculator.js'
  }
  
  const tool = await scriptToMcpTool(script as Script)
  
  t.truthy(tool)
  t.is(tool?.name, 'calc-tool')
  t.is(tool?.description, 'Performs calculations')
  t.is(tool?.placeholders.length, 3)
})

ava('should use command as tool name when mcp is true', async t => {
  const script: Partial<Script> = {
    command: 'my-tool',
    name: 'My Tool',
    description: 'A useful tool',
    mcp: true,
    filePath: '/test/my-tool.js'
  }
  
  const tool = await scriptToMcpTool(script as Script)
  
  t.truthy(tool)
  t.is(tool?.name, 'my-tool')
})

ava('should return null for scripts without mcp', async t => {
  const script: Partial<Script> = {
    command: 'no-mcp',
    name: 'No MCP Script',
    description: 'Not exposed via MCP'
  }
  
  const tool = await scriptToMcpTool(script as Script)
  
  t.is(tool, null)
})

ava('should create proper schema from script placeholders', async t => {
  const script: Partial<Script> = {
    command: 'test-tool',
    name: 'Test Tool',
    mcp: 'test',
    filePath: '/test/test.js'
  }
  
  const tool = await scriptToMcpTool(script as Script)
  
  t.truthy(tool)
  
  const schema = createToolSchema({
    name: tool!.name,
    filePath: script.filePath!,
    placeholders: tool!.placeholders
  })
  
  const shape = schema.shape
  t.truthy(shape.arg1) // First number
  t.truthy(shape.arg2) // Second number
  t.truthy(shape.arg3) // Operation
})