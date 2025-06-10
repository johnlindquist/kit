import ava from 'ava'
import * as acorn from 'acorn'
import tsPlugin from 'acorn-typescript'

// Function to extract ARG placeholders from script code
export async function extractArgPlaceholders(code: string): Promise<Array<{ name: string, placeholder: string | null }>> {
  const placeholders: Array<{ name: string, placeholder: string | null }> = []
  let argIndex = 0

  try {
    // Create parser with TypeScript plugin
    const Parser = acorn.Parser.extend(tsPlugin() as any)
    
    // Parse the code (handles both JS and TS)
    const ast = Parser.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
      locations: true // Required for acorn-typescript
    })

    // Walk the AST manually to avoid acorn-walk compatibility issues
    walkNode(ast)
    
    function walkNode(node: any) {
      if (!node || typeof node !== 'object') return
      
      // Check if this is a call expression
      if (node.type === 'CallExpression') {
        // Check if this is an arg() call
        if (node.callee && node.callee.name === 'arg') {
          argIndex++
          const argName = `arg${argIndex}`
          
          // Look for options object (second argument)
          if (node.arguments && node.arguments.length >= 2 && node.arguments[1].type === 'ObjectExpression') {
            const optionsObj = node.arguments[1]
            
            // Find placeholder property
            const placeholderProp = optionsObj.properties.find((prop: any) => 
              prop.key && (prop.key.name === 'placeholder' || prop.key.value === 'placeholder')
            )
            
            if (placeholderProp && placeholderProp.value && placeholderProp.value.type === 'Literal') {
              placeholders.push({ 
                name: argName, 
                placeholder: placeholderProp.value.value 
              })
            } else {
              placeholders.push({ name: argName, placeholder: null })
            }
          } else if (node.arguments && node.arguments.length >= 2 && node.arguments[1].type === 'ArrayExpression') {
            // This is a select-style arg with choices
            placeholders.push({ name: argName, placeholder: null })
          } else {
            // Simple arg with just a prompt
            placeholders.push({ name: argName, placeholder: null })
          }
        }
      }
      
      // Recursively walk all child nodes
      for (const key in node) {
        if (key === 'type' || key === 'start' || key === 'end' || key === 'loc' || key === 'range') continue
        
        const value = node[key]
        if (Array.isArray(value)) {
          value.forEach(walkNode)
        } else if (value && typeof value === 'object') {
          walkNode(value)
        }
      }
    }
  } catch (error) {
    console.error('Error parsing script:', error)
    throw error
  }

  return placeholders
}

// Test cases
ava('should extract placeholder from simple arg call', async t => {
  const code = `await arg("Enter name", { placeholder: "John Doe" })`
  const placeholders = await extractArgPlaceholders(code)
  t.deepEqual(placeholders, [{ name: "arg1", placeholder: "John Doe" }])
})

ava('should extract placeholders from multiple arg calls', async t => {
  const code = `
    const name = await arg("Name", { placeholder: "John" })
    const age = await arg("Age", { placeholder: "25" })
  `
  const placeholders = await extractArgPlaceholders(code)
  t.is(placeholders.length, 2)
  t.deepEqual(placeholders[0], { name: "arg1", placeholder: "John" })
  t.deepEqual(placeholders[1], { name: "arg2", placeholder: "25" })
})

ava('should handle args without placeholder option', async t => {
  const code = `await arg("Select option", ["option1", "option2"])`
  const placeholders = await extractArgPlaceholders(code)
  t.deepEqual(placeholders, [{ name: "arg1", placeholder: null }])
})

ava('should handle args with just a prompt', async t => {
  const code = `const input = await arg("Enter something")`
  const placeholders = await extractArgPlaceholders(code)
  t.deepEqual(placeholders, [{ name: "arg1", placeholder: null }])
})

ava('should handle complex placeholder values', async t => {
  const code = `
    await arg("Enter email", { 
      placeholder: "user@example.com",
      validate: (email) => email.includes("@")
    })
  `
  const placeholders = await extractArgPlaceholders(code)
  t.deepEqual(placeholders, [{ name: "arg1", placeholder: "user@example.com" }])
})

ava('should handle nested arg calls in script', async t => {
  const code = `
    async function main() {
      const firstName = await arg("First name", { placeholder: "Jane" })
      const lastName = await arg("Last name", { placeholder: "Smith" })
      
      if (firstName === "admin") {
        const password = await arg("Password", { placeholder: "********" })
      }
    }
    
    main()
  `
  const placeholders = await extractArgPlaceholders(code)
  t.is(placeholders.length, 3)
  t.deepEqual(placeholders[0], { name: "arg1", placeholder: "Jane" })
  t.deepEqual(placeholders[1], { name: "arg2", placeholder: "Smith" })
  t.deepEqual(placeholders[2], { name: "arg3", placeholder: "********" })
})

ava('should handle TypeScript syntax with interfaces and types', async t => {
  const code = `
    interface User {
      name: string
      email: string
    }
    
    type Status = 'active' | 'inactive'
    
    async function getUser(): Promise<User> {
      const name = await arg<string>("Name", { placeholder: "John Doe" })
      const email = await arg("Email", { placeholder: "user@example.com" })
      const status: Status = await arg("Status", ["active", "inactive"]) as Status
      
      return { name, email }
    }
  `
  const placeholders = await extractArgPlaceholders(code)
  t.is(placeholders.length, 3)
  t.deepEqual(placeholders[0], { name: "arg1", placeholder: "John Doe" })
  t.deepEqual(placeholders[1], { name: "arg2", placeholder: "user@example.com" })
  t.deepEqual(placeholders[2], { name: "arg3", placeholder: null })
})

ava('should handle TypeScript generics and complex types', async t => {
  const code = `
    async function processData<T extends string>(data: T[]): Promise<void> {
      const filterValue = await arg<T>("Filter by", { placeholder: "search term" })
      const maxResults: number = parseInt(await arg("Max results", { placeholder: "10" }))
      
      const filtered = data.filter((item: T) => item.includes(filterValue))
    }
  `
  const placeholders = await extractArgPlaceholders(code)
  t.is(placeholders.length, 2)
  t.deepEqual(placeholders[0], { name: "arg1", placeholder: "search term" })
  t.deepEqual(placeholders[1], { name: "arg2", placeholder: "10" })
})