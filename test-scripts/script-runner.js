#!/usr/bin/env node

// Mock Script Kit globals
global.args = process.argv.slice(2)

// Mock arg function that uses command line arguments
let argIndex = 0
global.arg = async (prompt, options) => {
  const value = global.args[argIndex] || ''
  argIndex++
  return value
}

// Load and run the script
const scriptPath = process.argv[2]
if (!scriptPath) {
  console.error("Usage: node script-runner.js <script-path> [args...]")
  process.exit(1)
}

// Remove script path from args
global.args = process.argv.slice(3)

// Import and run the script
import(scriptPath).then(module => {
  // If the module exports something, log it as JSON
  if (module.default || Object.keys(module).length > 0) {
    const result = module.default || module
    if (typeof result === 'object') {
      console.log(JSON.stringify(result))
    }
  }
}).catch(err => {
  console.error("Error running script:", err)
  process.exit(1)
})