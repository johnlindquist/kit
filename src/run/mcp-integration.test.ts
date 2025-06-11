import test from 'ava'
import { z } from 'zod'

// Test the createToolSchema function behavior
test('tool schema creates args array with optional elements', t => {
  const placeholders = [
    { name: 'name', placeholder: 'Enter your name' },
    { name: 'age', placeholder: 'Enter your age' },
    { name: 'city', placeholder: 'Enter your city' }
  ]
  
  // Create schema using the same logic as MCP server
  const items = placeholders.map(placeholder => 
    z.string().optional().describe(placeholder.placeholder)
  )
  
  const schema = z.object({
    args: z.tuple(items as any).optional().default([])
  })
  
  // Test valid inputs
  const valid1 = schema.parse({ args: ['John', '25', 'NYC'] })
  t.deepEqual(valid1.args, ['John', '25', 'NYC'])
  
  const valid2 = schema.parse({ args: ['John'] })
  t.deepEqual(valid2.args, ['John'])
  
  const valid3 = schema.parse({ args: [] })
  t.deepEqual(valid3.args, [])
  
  const valid4 = schema.parse({})
  t.deepEqual(valid4.args, [])
  
  // Test that elements can be undefined
  const valid5 = schema.parse({ args: ['John', undefined, 'NYC'] })
  t.deepEqual(valid5.args, ['John', undefined, 'NYC'])
})

test('args array maps correctly to script arguments', t => {
  const placeholders = [
    { name: 'firstName', placeholder: null },
    { name: 'lastName', placeholder: null },
    { name: 'greeting', placeholder: null }
  ]
  
  // Simulate the arg mapping logic
  const argsArray = ['John', 'Doe']
  const args = placeholders.map((_, index) => argsArray[index] || '')
  
  t.deepEqual(args, ['John', 'Doe', ''])
})

test('lazy args concept - missing args are empty strings', t => {
  const placeholders = [
    { name: 'required1', placeholder: 'Required field 1' },
    { name: 'required2', placeholder: 'Required field 2' },
    { name: 'optional1', placeholder: 'Optional field 1' },
    { name: 'optional2', placeholder: 'Optional field 2' }
  ]
  
  // Client only provides first two args
  const providedArgs = ['value1', 'value2']
  const mappedArgs = placeholders.map((_, index) => providedArgs[index] || '')
  
  // Remaining args are empty strings, allowing Script Kit to prompt for them
  t.deepEqual(mappedArgs, ['value1', 'value2', '', ''])
  
  // This simulates Script Kit's lazy behavior:
  // - arg1 gets 'value1' 
  // - arg2 gets 'value2'
  // - arg3 and arg4 get '', triggering prompts in interactive mode
})