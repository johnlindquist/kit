// mcp: greet-user
// description: Test script that uses arg() and exports result

const name = await arg("Enter your name")
const greeting = `Hello, ${name}!`

const result = {
  greeting,
  name,
  timestamp: new Date().toISOString()
}

export default result