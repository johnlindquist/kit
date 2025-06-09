import ava from 'ava'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { randomUUID } from 'crypto'
import { extractArgPlaceholders } from '../core/arg-parser.test'

// Mock type for discovered script
export interface DiscoveredScript {
  name: string
  filePath: string
  placeholders: Array<{ name: string; placeholder: string | null }>
  metadata?: Record<string, any>
}

// Function to discover scripts in a directory
export async function discoverScripts(directory: string): Promise<DiscoveredScript[]> {
  // This would use globby to find all .js/.ts files
  // For now, mock implementation
  const scripts: DiscoveredScript[] = []
  
  // In real implementation:
  // 1. Use globby to find all script files
  // 2. Read each file
  // 3. Parse metadata comments
  // 4. Extract ARG placeholders
  // 5. Return script info
  
  return scripts
}

// Function to parse a single script file
export async function parseScriptFile(filePath: string, content: string): Promise<DiscoveredScript> {
  // Extract metadata from comments
  const metadata: Record<string, any> = {}
  const metadataRegex = /\/\/\s*(\w+):\s*(.+)/g
  let match
  
  while ((match = metadataRegex.exec(content)) !== null) {
    const [, key, value] = match
    metadata[key.toLowerCase()] = value.trim()
  }
  
  // Extract name from metadata or filename
  const name = metadata.name || filePath.split('/').pop()?.replace(/\.(js|ts)$/, '') || 'unnamed'
  
  // Extract ARG placeholders
  const placeholders = await extractArgPlaceholders(content)
  
  return {
    name,
    filePath,
    placeholders,
    metadata
  }
}

// Helper to create test directory structure
async function createTestScriptDirectory(): Promise<string> {
  const testDir = join(tmpdir(), 'kit-discovery-test', randomUUID())
  const scriptsDir = join(testDir, 'scripts')
  mkdirSync(scriptsDir, { recursive: true })
  
  // Create some test scripts
  writeFileSync(join(scriptsDir, 'hello.js'), `
// Name: Hello World
// Description: A simple greeting script
// Author: Test User

const name = await arg("What's your name?", { placeholder: "John Doe" })
console.log(\`Hello, \${name}!\`)
export default { greeted: name }
  `, 'utf-8')
  
  writeFileSync(join(scriptsDir, 'calculator.js'), `
// Name: Calculator
// Description: Basic math operations

const num1 = await arg("First number", { placeholder: "10" })
const num2 = await arg("Second number", { placeholder: "5" })
const operation = await arg("Operation", ["add", "subtract", "multiply", "divide"])

let result
switch(operation) {
  case "add": result = Number(num1) + Number(num2); break
  case "subtract": result = Number(num1) - Number(num2); break
  case "multiply": result = Number(num1) * Number(num2); break
  case "divide": result = Number(num1) / Number(num2); break
}

export default { result, operation }
  `, 'utf-8')
  
  writeFileSync(join(scriptsDir, 'no-args.js'), `
// Name: No Arguments
// Description: Script without arguments

console.log("This script needs no input!")
export default { timestamp: new Date().toISOString() }
  `, 'utf-8')
  
  return scriptsDir
}

// Test cases
ava('should parse script metadata correctly', async t => {
  const content = `
// Name: Test Script
// Description: A test script
// Author: Test Author
// Version: 1.0.0

await arg("Input", { placeholder: "default" })
  `
  
  const script = await parseScriptFile('/test/script.js', content)
  
  t.is(script.name, 'Test Script')
  t.is(script.metadata?.description, 'A test script')
  t.is(script.metadata?.author, 'Test Author')
  t.is(script.metadata?.version, '1.0.0')
})

ava('should extract all placeholders from script', async t => {
  const content = `
// Name: Multi Input Script

const firstName = await arg("First name", { placeholder: "Jane" })
const lastName = await arg("Last name", { placeholder: "Doe" })
const age = await arg("Age", { placeholder: "25" })
  `
  
  const script = await parseScriptFile('/test/multi-input.js', content)
  
  t.is(script.placeholders.length, 3)
  t.deepEqual(script.placeholders[0], { name: "arg1", placeholder: "Jane" })
  t.deepEqual(script.placeholders[1], { name: "arg2", placeholder: "Doe" })
  t.deepEqual(script.placeholders[2], { name: "arg3", placeholder: "25" })
})

ava('should handle scripts without metadata comments', async t => {
  const content = `
const input = await arg("Enter something")
console.log(input)
  `
  
  const script = await parseScriptFile('/path/to/my-script.js', content)
  
  t.is(script.name, 'my-script')
  t.deepEqual(script.metadata, {})
})

ava('should handle scripts with select-style args', async t => {
  const content = `
// Name: Menu Script

const choice = await arg("Pick one", ["option1", "option2", "option3"])
const confirm = await arg("Are you sure?", { placeholder: "yes/no" })
  `
  
  const script = await parseScriptFile('/test/menu.js', content)
  
  t.is(script.placeholders.length, 2)
  t.is(script.placeholders[0].placeholder, null) // Select-style has no placeholder
  t.is(script.placeholders[1].placeholder, "yes/no")
})

ava('should create proper script info for MCP integration', async t => {
  const scriptsDir = await createTestScriptDirectory()
  
  // In real implementation, this would use discoverScripts
  const helloContent = `
// Name: Hello World
// Description: A simple greeting script
// Author: Test User

const name = await arg("What's your name?", { placeholder: "John Doe" })
console.log(\`Hello, \${name}!\`)
export default { greeted: name }
  `
  
  const script = await parseScriptFile(join(scriptsDir, 'hello.js'), helloContent)
  
  t.is(script.name, 'Hello World')
  t.is(script.metadata?.description, 'A simple greeting script')
  t.is(script.placeholders.length, 1)
  t.deepEqual(script.placeholders[0], { name: "arg1", placeholder: "John Doe" })
  
  // Cleanup
  rmSync(scriptsDir, { recursive: true, force: true })
})

ava('should handle TypeScript scripts', async t => {
  const content = `
// Name: TypeScript Example
// Language: TypeScript

interface User {
  name: string
  age: number
}

const name = await arg<string>("Name", { placeholder: "Alice" })
const age = await arg<string>("Age", { placeholder: "30" })

const user: User = {
  name,
  age: parseInt(age)
}

export default user
  `
  
  const script = await parseScriptFile('/test/typescript.ts', content)
  
  t.is(script.name, 'TypeScript Example')
  t.is(script.metadata?.language, 'TypeScript')
  t.is(script.placeholders.length, 2)
})