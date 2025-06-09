import ava from 'ava'
import { Parser } from 'acorn'
import { simple } from 'acorn-walk'

// Simple function to strip TypeScript syntax before parsing
function stripTypeScript(code: string): string {
  // Remove interface definitions (multi-line)
  code = code.replace(/interface\s+\w+\s*\{[^}]*\}/gs, '')
  
  // Remove type annotations from variables and parameters (more precise)
  code = code.replace(/:\s*[A-Za-z_$][\w$]*(\[\])?(\<[^>]+\>)?(?=[,;)=\s])/g, '')
  
  // Remove generic type parameters from function calls like arg<string>
  code = code.replace(/(<)([A-Za-z_$][\w$]*)(>)(?=\s*\()/g, '')
  
  // Remove type declarations
  code = code.replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
  
  // Remove 'as' type assertions
  code = code.replace(/\s+as\s+[A-Za-z_$][\w$]*(\[\])?/g, '')
  
  return code
}

// Function to extract ARG placeholders from script code
export async function extractArgPlaceholders(code: string): Promise<Array<{ name: string, placeholder: string | null }>> {
  const placeholders: Array<{ name: string, placeholder: string | null }> = []
  let argIndex = 0

  try {
    let ast: any
    
    // Check if code contains TypeScript syntax
    const hasTypeScript = /interface\s+\w+|:\s*[A-Za-z]|<[A-Za-z]+>/.test(code)
    
    if (hasTypeScript) {
      // Strip TypeScript syntax before parsing
      const jsCode = stripTypeScript(code)
      ast = Parser.parse(jsCode, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        allowAwaitOutsideFunction: true
      })
    } else {
      // Parse as regular JavaScript
      ast = Parser.parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        allowAwaitOutsideFunction: true
      })
    }

    simple(ast, {
      CallExpression(node: any) {
        // Check if this is an arg() call
        if (node.callee.name === 'arg') {
          argIndex++
          const argName = `arg${argIndex}`
          
          // Look for options object (second argument)
          if (node.arguments.length >= 2 && node.arguments[1].type === 'ObjectExpression') {
            const optionsObj = node.arguments[1]
            
            // Find placeholder property
            const placeholderProp = optionsObj.properties.find((prop: any) => 
              prop.key.name === 'placeholder' || prop.key.value === 'placeholder'
            )
            
            if (placeholderProp && placeholderProp.value.type === 'Literal') {
              placeholders.push({ 
                name: argName, 
                placeholder: placeholderProp.value.value 
              })
            } else {
              placeholders.push({ name: argName, placeholder: null })
            }
          } else if (node.arguments.length >= 2 && node.arguments[1].type === 'ArrayExpression') {
            // This is a select-style arg with choices
            placeholders.push({ name: argName, placeholder: null })
          } else {
            // Simple arg with just a prompt
            placeholders.push({ name: argName, placeholder: null })
          }
        }
      }
    })
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