#!/usr/bin/env node

// Script runner that provides Kit environment
const scriptPath = process.argv[2]
const scriptArgs = process.argv.slice(3)

if (!scriptPath) {
  console.error("Usage: script-runner-kit.js <script-path> [args...]")
  process.exit(1)
}

// Set up Kit globals
;(global as any).args = scriptArgs

// Mock arg function that uses command line arguments
let argIndex = 0
;(global as any).arg = async (prompt: string, options?: any) => {
  const value = (global as any).args[argIndex] || ''
  argIndex++
  return value
}

// Import Kit environment
import '@johnlindquist/kit'

// Import and run the script
import(scriptPath).then(module => {
  // Script should have already logged its result
}).catch(err => {
  console.error("Error running script:", err)
  process.exit(1)
})