// Name: Hello MCP
// Description: A simple test script for MCP

async function main() {
  const name = await arg("What's your name?", { placeholder: "World" })
  const greeting = await arg("Greeting type", ["Hello", "Hi", "Hey", "Greetings"])

  console.error(`${greeting}, ${name}!`)

  return {
    greeted: name,
    greeting: greeting,
    timestamp: new Date().toISOString()
  }
}

// Run the script and export the result
const result = await main()
console.log(JSON.stringify(result))
export default result