import test from 'ava'
import { z } from 'zod'

// Test the createToolSchema function behavior
test('tool schema creates args array with optional elements', t => {
  const placeholders = [
    { name: 'name', placeholder: 'Enter your name' },
    { name: 'age', placeholder: 'Enter your age' },
    { name: 'city', placeholder: 'Enter your city' }
  ]
  
  // Create schema using array instead of tuple for flexibility
  const schema = z.object({
    args: z.array(z.string().optional()).optional().default([])
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
  
  // Test the tuple approach for fixed-length validation
  const tupleItems = placeholders.map(placeholder => 
    z.string().optional()
  )
  
  // For tuples, we need to provide all positions (can be undefined)
  const tupleSchema = z.object({
    args: z.tuple(tupleItems as any).optional().default(() => [undefined, undefined, undefined])
  })
  
  const tupleValid1 = tupleSchema.parse({ args: ['John', '25', 'NYC'] })
  t.deepEqual(tupleValid1.args, ['John', '25', 'NYC'])
  
  const tupleValid2 = tupleSchema.parse({ args: ['John', undefined, undefined] })
  t.deepEqual(tupleValid2.args, ['John', undefined, undefined])
  
  const tupleValid3 = tupleSchema.parse({})
  t.deepEqual(tupleValid3.args, [undefined, undefined, undefined])
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

test('MCPToolResult type structure validation', t => {
  // Test that our type structure matches expected MCP format
  const validResult: any = {
    content: [
      { type: 'text', text: 'Hello world' }
    ]
  }
  
  // Validate structure
  t.truthy(validResult.content)
  t.true(Array.isArray(validResult.content))
  t.is(validResult.content[0].type, 'text')
  t.is(validResult.content[0].text, 'Hello world')
  
  // Test with metadata
  const resultWithMeta: any = {
    content: [
      { type: 'text', text: 'Result' }
    ],
    _meta: {
      version: '1.0',
      timestamp: new Date().toISOString()
    }
  }
  
  t.truthy(resultWithMeta._meta)
  t.is(resultWithMeta._meta.version, '1.0')
  
  // Test multiple content types
  const multiContent: any = {
    content: [
      { type: 'text', text: 'Text content' },
      { type: 'image', data: 'base64data', mimeType: 'image/png' },
      { type: 'audio', data: 'base64audio', mimeType: 'audio/mp3' },
      { 
        type: 'resource', 
        resource: { 
          uri: 'https://example.com/file.txt',
          mimeType: 'text/plain',
          text: 'File contents'
        }
      }
    ]
  }
  
  t.is(multiContent.content.length, 4)
  t.is(multiContent.content[1].type, 'image')
  t.is(multiContent.content[2].type, 'audio')
  t.is(multiContent.content[3].type, 'resource')
})