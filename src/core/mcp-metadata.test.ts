import ava from 'ava'
import { getMetadata, parseMetadata } from './utils'

ava('should parse mcp metadata', t => {
  const content = `
// Name: Calculator Tool
// Description: Performs basic math operations
// mcp: calculator

const num1 = await arg("First number", { placeholder: "10" })
const num2 = await arg("Second number", { placeholder: "5" })
`

  const metadata = getMetadata(content)
  
  t.is(metadata.name, 'Calculator Tool')
  t.is(metadata.description, 'Performs basic math operations')
  t.is(metadata.mcp, 'calculator')
})

ava('should handle mcp metadata with boolean value', t => {
  const content = `
// Name: My Tool
// mcp: true

const result = await arg("Input")
`

  const metadata = getMetadata(content)
  
  t.is(metadata.name, 'My Tool')
  t.is(metadata.mcp, true)
})

ava('should parse multiple metadata fields with mcp', t => {
  const content = `
// Name: Advanced Tool
// Description: A complex automation tool
// Author: John Doe
// mcp: advanced-tool
// Schedule: 0 9 * * *
// Background: true

await arg("Test")
`

  const metadata = getMetadata(content)
  
  t.is(metadata.name, 'Advanced Tool')
  t.is(metadata.description, 'A complex automation tool')
  t.is(metadata.author, 'John Doe')
  t.is(metadata.mcp, 'advanced-tool')
  t.is(metadata.schedule, '0 9 * * *')
  t.is(metadata.background, true)
})

ava('should handle mcp with spaces in name', t => {
  const content = `
// Name: Text Processor
// mcp: text processor

const text = await arg("Enter text")
`

  const metadata = getMetadata(content)
  
  t.is(metadata.mcp, 'text processor')
})

ava('should ignore mcp in non-metadata comments', t => {
  const content = `
// Name: Test Script
// Description: Testing

// This is not metadata: mcp: fake
/* Also not metadata mcp: fake2 */

const code = "// mcp: also-not-metadata"
`

  const metadata = getMetadata(content)
  
  t.is(metadata.name, 'Test Script')
  t.is(metadata.description, 'Testing')
  t.is(metadata.mcp, undefined)
})