import ava from 'ava'
import * as acorn from 'acorn'
import tsPlugin from 'acorn-typescript'

// Function to extract prompt calls from script code
export async function extractPromptCalls(code: string): Promise<Array<{ 
  type: string, 
  prompt: string | null,
  hasConfig: boolean,
  argIndex: number 
}>> {
  const prompts: Array<{ 
    type: string, 
    prompt: string | null,
    hasConfig: boolean,
    argIndex: number 
  }> = []
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

// Tests
ava('should extract simple arg prompt', async t => {
  const code = `await arg("Enter your name")`
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 1)
  t.deepEqual(prompts[0], {
    type: 'arg',
    prompt: 'Enter your name',
    hasConfig: false,
    argIndex: 1
  })
})

ava('should extract arg with PromptConfig', async t => {
  const code = `await arg({ placeholder: "Enter email", hint: "user@example.com" })`
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 1)
  t.deepEqual(prompts[0], {
    type: 'arg',
    prompt: 'Enter email',
    hasConfig: true,
    argIndex: 1
  })
})

ava('should extract multiple prompt types', async t => {
  const code = `
    const name = await arg("Enter name")
    const items = await select("Choose items", ["a", "b", "c"])
    const content = await editor("Edit content")
    const story = await textarea("Write your story")
  `
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 4)
  t.deepEqual(prompts[0], { type: 'arg', prompt: 'Enter name', hasConfig: false, argIndex: 1 })
  t.deepEqual(prompts[1], { type: 'select', prompt: 'Choose items', hasConfig: false, argIndex: 2 })
  t.deepEqual(prompts[2], { type: 'editor', prompt: 'Edit content', hasConfig: false, argIndex: 3 })
  t.deepEqual(prompts[3], { type: 'textarea', prompt: 'Write your story', hasConfig: false, argIndex: 4 })
})

ava('should extract grid prompts', async t => {
  const code = `
    const option = await grid("Select option", [
      { name: "Option 1", value: "1" },
      { name: "Option 2", value: "2" }
    ])
  `
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 1)
  t.deepEqual(prompts[0], {
    type: 'grid',
    prompt: 'Select option',
    hasConfig: false,
    argIndex: 1
  })
})

ava('should extract env prompts', async t => {
  const code = `
    const apiKey = await env("OPENAI_API_KEY")
    const token = await env("GITHUB_TOKEN", "Enter your GitHub token")
    const secret = await env("SECRET", { placeholder: "Enter secret", reset: true })
  `
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 3)
  t.deepEqual(prompts[0], { type: 'env', prompt: null, hasConfig: false, argIndex: 1 })
  t.deepEqual(prompts[1], { type: 'env', prompt: 'Enter your GitHub token', hasConfig: false, argIndex: 2 })
  t.deepEqual(prompts[2], { type: 'env', prompt: 'Enter secret', hasConfig: true, argIndex: 3 })
})

ava('should extract path prompts', async t => {
  const code = `
    const file = await path("Select a file")
    const folder = await path({ 
      placeholder: "Choose folder", 
      type: "folder" 
    })
  `
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 2)
  t.deepEqual(prompts[0], { type: 'path', prompt: 'Select a file', hasConfig: false, argIndex: 1 })
  t.deepEqual(prompts[1], { type: 'path', prompt: 'Choose folder', hasConfig: true, argIndex: 2 })
})

ava('should extract div prompts', async t => {
  const code = `
    await div("# Welcome")
    await div({ html: "<h1>Hello</h1>", placeholder: "Loading..." })
  `
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 2)
  t.deepEqual(prompts[0], { type: 'div', prompt: '# Welcome', hasConfig: false, argIndex: 1 })
  t.deepEqual(prompts[1], { type: 'div', prompt: 'Loading...', hasConfig: true, argIndex: 2 })
})

ava('should extract form prompts', async t => {
  const code = `
    const data = await form("Fill out the form", {
      name: "text",
      email: "email",
      age: "number"
    })
  `
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 1)
  t.deepEqual(prompts[0], {
    type: 'form',
    prompt: 'Fill out the form',
    hasConfig: false,
    argIndex: 1
  })
})

ava('should handle TypeScript syntax', async t => {
  const code = `
    interface User {
      name: string
      email: string
    }
    
    const name = await arg<string>("Enter name")
    const users = await select<User[]>("Choose users", async () => {
      return fetchUsers()
    })
    const config: PromptConfig = { placeholder: "Type here" }
    const input = await arg(config)
  `
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 3)
  t.deepEqual(prompts[0], { type: 'arg', prompt: 'Enter name', hasConfig: false, argIndex: 1 })
  t.deepEqual(prompts[1], { type: 'select', prompt: 'Choose users', hasConfig: false, argIndex: 2 })
  t.deepEqual(prompts[2], { type: 'arg', prompt: null, hasConfig: false, argIndex: 3 }) // config is a variable, not object literal
})

ava('should handle nested prompts', async t => {
  const code = `
    async function getUser() {
      const name = await arg("Name")
      const email = await arg("Email")
      return { name, email }
    }
    
    const action = await select("Choose action", ["create", "edit"])
    if (action === "create") {
      const user = await getUser()
    }
  `
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 3)
  t.deepEqual(prompts[0], { type: 'arg', prompt: 'Name', hasConfig: false, argIndex: 1 })
  t.deepEqual(prompts[1], { type: 'arg', prompt: 'Email', hasConfig: false, argIndex: 2 })
  t.deepEqual(prompts[2], { type: 'select', prompt: 'Choose action', hasConfig: false, argIndex: 3 })
})

ava('should extract micro and mini prompts', async t => {
  const code = `
    const quick = await micro("Quick input")
    const small = await mini("Small prompt")
    const tiny = await micro({ placeholder: "Tiny input", hint: "Be brief" })
  `
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 3)
  t.deepEqual(prompts[0], { type: 'micro', prompt: 'Quick input', hasConfig: false, argIndex: 1 })
  t.deepEqual(prompts[1], { type: 'mini', prompt: 'Small prompt', hasConfig: false, argIndex: 2 })
  t.deepEqual(prompts[2], { type: 'micro', prompt: 'Tiny input', hasConfig: true, argIndex: 3 })
})

ava('should extract drop prompts', async t => {
  const code = `
    const files = await drop("Drop files here")
    const images = await drop({ placeholder: "Drop images", accept: "image/*" })
  `
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 2)
  t.deepEqual(prompts[0], { type: 'drop', prompt: 'Drop files here', hasConfig: false, argIndex: 1 })
  t.deepEqual(prompts[1], { type: 'drop', prompt: 'Drop images', hasConfig: true, argIndex: 2 })
})

ava('should extract fields prompts', async t => {
  const code = `
    const data = await fields("Enter details", [
      { name: "name", label: "Name", type: "text" },
      { name: "age", label: "Age", type: "number" }
    ])
    const config = await fields({
      placeholder: "Configuration",
      fields: [{ name: "key", label: "API Key" }]
    })
  `
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 2)
  t.deepEqual(prompts[0], { type: 'fields', prompt: 'Enter details', hasConfig: false, argIndex: 1 })
  t.deepEqual(prompts[1], { type: 'fields', prompt: 'Configuration', hasConfig: true, argIndex: 2 })
})

ava('should extract hotkey prompts', async t => {
  const code = `
    const key = await hotkey("Press a key")
    const combo = await hotkey({ placeholder: "Press key combo" })
  `
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 2)
  t.deepEqual(prompts[0], { type: 'hotkey', prompt: 'Press a key', hasConfig: false, argIndex: 1 })
  t.deepEqual(prompts[1], { type: 'hotkey', prompt: 'Press key combo', hasConfig: true, argIndex: 2 })
})

ava('should extract webcam and mic prompts', async t => {
  const code = `
    const photo = await webcam("Take a photo")
    const video = await webcam({ placeholder: "Record video", duration: 5000 })
    const audio = await mic("Record message")
    const sound = await mic({ placeholder: "Say something" })
  `
  const prompts = await extractPromptCalls(code)
  t.is(prompts.length, 4)
  t.deepEqual(prompts[0], { type: 'webcam', prompt: 'Take a photo', hasConfig: false, argIndex: 1 })
  t.deepEqual(prompts[1], { type: 'webcam', prompt: 'Record video', hasConfig: true, argIndex: 2 })
  t.deepEqual(prompts[2], { type: 'mic', prompt: 'Record message', hasConfig: false, argIndex: 3 })
  t.deepEqual(prompts[3], { type: 'mic', prompt: 'Say something', hasConfig: true, argIndex: 4 })
})