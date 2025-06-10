import * as acorn from 'acorn'
import tsPlugin from 'acorn-typescript'

export interface PromptCall {
  type: string
  prompt: string | null
  hasConfig: boolean
  argIndex: number
}

// Function to extract prompt calls from script code
export async function extractPromptCalls(code: string): Promise<PromptCall[]> {
  const prompts: PromptCall[] = []
  let promptIndex = 0

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
        // List of prompt functions to detect
        const promptFunctions = [
          'arg', 'select', 'grid', 'editor', 'textarea', 'div', 'form', 
          'path', 'env', 'micro', 'mini', 'drop', 'fields', 'hotkey',
          'webcam', 'mic'
        ]
        
        // Check if this is a prompt call
        if (node.callee && promptFunctions.includes(node.callee.name)) {
          promptIndex++
          const promptType = node.callee.name
          
          // Get first argument (prompt or config)
          const firstArg = node.arguments?.[0]
          const secondArg = node.arguments?.[1]
          let promptText: string | null = null
          let hasConfig = false
          
          // Special handling for env() which takes envKey as first arg
          if (promptType === 'env') {
            if (secondArg) {
              if (secondArg.type === 'Literal' && typeof secondArg.value === 'string') {
                // Second arg is the prompt
                promptText = secondArg.value
              } else if (secondArg.type === 'ObjectExpression') {
                // Second arg is config object
                hasConfig = true
                const placeholderProp = secondArg.properties.find((prop: any) => 
                  prop.key && (prop.key.name === 'placeholder' || prop.key.value === 'placeholder')
                )
                if (placeholderProp && placeholderProp.value && placeholderProp.value.type === 'Literal') {
                  promptText = placeholderProp.value.value
                }
              }
            }
          } else {
            // Standard prompt functions
            if (firstArg) {
              if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
                // Simple string prompt
                promptText = firstArg.value
              } else if (firstArg.type === 'ObjectExpression') {
                // PromptConfig object
                hasConfig = true
                
                // Look for placeholder property
                const placeholderProp = firstArg.properties.find((prop: any) => 
                  prop.key && (prop.key.name === 'placeholder' || prop.key.value === 'placeholder')
                )
                
                if (placeholderProp && placeholderProp.value && placeholderProp.value.type === 'Literal') {
                  promptText = placeholderProp.value.value
                }
              }
            }
          }
          
          prompts.push({
            type: promptType,
            prompt: promptText,
            hasConfig,
            argIndex: promptIndex
          })
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

  return prompts
}