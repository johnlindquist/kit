// mcp: export-console
// description: Test script that outputs JSON via console.log

const result = {
  message: "Hello from console.log JSON",
  timestamp: new Date().toISOString(),
  type: "console-json"
}

console.log(JSON.stringify(result))