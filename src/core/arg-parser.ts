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