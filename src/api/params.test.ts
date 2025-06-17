import ava from 'ava'
import type { InputSchema } from './params.js'

// Test params() in isolation with proper state management
ava('params() basic functionality test', async (t) => {
  // Set up test environment
  process.env.KIT_TARGET = 'test'
  
  // Clear any existing global state
  delete (global as any).headers
  delete process.env.KIT_MCP_CALL
  process.argv = ['node', 'script.js']
  
  // Track arg calls
  const argCalls: any[] = []
  ;(global.arg as any) = async (config: any): Promise<any> => {
    argCalls.push(config)
    
    // Return different values based on placeholder
    if (config?.placeholder?.includes('name')) {
      return 'Test User'
    }
    if (config?.placeholder?.includes('fruit')) {
      return 'banana'
    }
    if (config?.placeholder?.includes('age')) {
      return '25'
    }
    return 'default'
  }
  
  // Import params
  const { params } = await import('./params.js')
  
  // Test 1: Basic parameter prompting
  t.log('Test 1: Basic parameter prompting')
  argCalls.length = 0 // Reset
  
  const result1 = await params({
    name: {
      type: 'string',
      description: 'Enter your name',
      required: true
    }
  })
  
  t.is(argCalls.length, 1, 'Should prompt once')
  t.is(argCalls[0].placeholder, 'Enter your name')
  t.deepEqual(result1, { name: 'Test User' })
  
  // Test 2: Enum with choices
  t.log('Test 2: Enum with choices')
  argCalls.length = 0 // Reset
  
  const result2 = await params({
    fruit: {
      type: 'string',
      description: 'Select fruit',
      enum: ['apple', 'banana', 'cherry']
    }
  })
  
  t.is(argCalls.length, 1)
  t.deepEqual(argCalls[0].choices, [
    { name: 'apple', value: 'apple' },
    { name: 'banana', value: 'banana' },
    { name: 'cherry', value: 'cherry' }
  ])
  t.deepEqual(result2, { fruit: 'banana' })
  
  // Test 3: Default values
  t.log('Test 3: Default values')
  argCalls.length = 0 // Reset
  
  const result3 = await params({
    port: {
      type: 'number',
      description: 'Port number',
      default: 3000
    },
    host: {
      type: 'string',
      description: 'Host address',
      default: 'localhost'
    }
  })
  
  t.is(argCalls.length, 0, 'Should not prompt for defaults')
  t.deepEqual(result3, { port: 3000, host: 'localhost' })
  
  // Test 4: CLI arguments
  t.log('Test 4: CLI arguments')
  argCalls.length = 0 // Reset
  process.argv = ['node', 'script.js', '--name', 'CLI User', '--age', '30']
  
  const result4 = await params({
    name: { type: 'string', description: 'Your name' },
    age: { type: 'number', description: 'Your age' }
  })
  
  t.is(argCalls.length, 0, 'Should not prompt when CLI args provided')
  t.deepEqual(result4, { name: 'CLI User', age: 30 })
  
  // Test 5: MCP headers
  t.log('Test 5: MCP headers')
  argCalls.length = 0 // Reset
  process.argv = ['node', 'script.js'] // Reset argv
  global.headers = {
    'X-MCP-Parameters': JSON.stringify({ action: 'test', value: 42 })
  }
  
  const result5 = await params({
    action: { type: 'string', description: 'Action to perform' },
    value: { type: 'number', description: 'Value to use' }
  })
  
  t.is(argCalls.length, 0, 'Should not prompt when MCP headers present')
  t.deepEqual(result5, { action: 'test', value: 42 })
  
  // Test 6: MCP environment variable
  t.log('Test 6: MCP environment variable')
  argCalls.length = 0 // Reset
  delete (global as any).headers
  process.env.KIT_MCP_CALL = JSON.stringify({
    parameters: { task: 'process', priority: 'high' }
  })
  
  const result6 = await params({
    task: { type: 'string', description: 'Task to run' },
    priority: { type: 'string', description: 'Priority level' }
  })
  
  t.is(argCalls.length, 0, 'Should not prompt when MCP env present')
  t.deepEqual(result6, { task: 'process', priority: 'high' })
  
  // Clean up
  delete process.env.KIT_TARGET
  delete process.env.KIT_MCP_CALL
  delete (global as any).headers
  process.argv = ['node', 'script.js']
})