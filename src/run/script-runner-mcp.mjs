#!/usr/bin/env node

import { pathToFileURL } from 'url'
import { Console } from 'console'
import { Writable } from 'stream'

// Import Kit environment
await import('@johnlindquist/kit')

// Capture console output
let capturedOutput = ''
const originalConsoleLog = console.log

// Create a custom console that captures output
const outputStream = new Writable({
  write(chunk, encoding, callback) {
    capturedOutput += chunk.toString()
    callback()
  }
})

const captureConsole = new Console({ stdout: outputStream, stderr: outputStream })

// Override console.log to capture output
console.log = (...args) => {
  captureConsole.log(...args)
  // Also log to stderr so we can see debug output
  console.error('[console.log]', ...args)
}

async function runScript() {
  const scriptPath = process.argv[2]
  if (!scriptPath) {
    console.error('No script path provided')
    process.exit(1)
  }

  // Get remaining args for the script
  const scriptArgs = process.argv.slice(3)

  try {
    // Set up global args for the script
    global.args = scriptArgs
    let argIndex = 0
    
    // Mock arg function that uses provided args
    global.arg = async (prompt) => {
      const promptText = typeof prompt === 'string' ? prompt : prompt?.placeholder || 'Input'
      console.error(`[arg] prompt: "${promptText}", returning: "${scriptArgs[argIndex] || ''}"`)
      return scriptArgs[argIndex++] || ''
    }

    // Import the script as an ES module
    const scriptUrl = pathToFileURL(scriptPath).href
    console.error(`[runner] Importing script: ${scriptUrl}`)
    
    const module = await import(scriptUrl)
    
    // Get the result from the module
    let result = module.default
    
    // If no default export, check for named exports
    if (result === undefined && Object.keys(module).length > 0) {
      // Get the first named export
      const firstExport = Object.keys(module).find(key => key !== 'default')
      if (firstExport) {
        result = module[firstExport]
      }
    }

    // If still no result, check captured console output
    if (result === undefined && capturedOutput) {
      const trimmed = capturedOutput.trim()
      // Try to parse as JSON
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          result = JSON.parse(trimmed)
        } catch (e) {
          // Not valid JSON, use as plain text
          result = trimmed
        }
      } else {
        result = trimmed
      }
    }

    // Always write to stdout
    console.log = originalConsoleLog // Restore original console.log
    console.log(JSON.stringify(result))
    process.exit(0)
  } catch (error) {
    console.error('[runner] Error:', error)
    console.log = originalConsoleLog
    console.log(JSON.stringify({ error: error.message }))
    process.exit(1)
  }
}

// Run the script
runScript()