// Test setup file to ensure globals are initialized before tests run
// This fixes Windows CI failures caused by race conditions in module initialization

// Import the child_process globals directly to ensure they're attached
import "../src/globals/child_process.js"

// Import other globals that might be needed
import "../src/api/global.js"

// Log to confirm setup runs
console.log("[Test Setup] Globals initialized for test environment")