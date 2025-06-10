// Name: Calculator
// Description: Basic math operations
// mcp: calculator

async function main() {
  const num1 = await arg("First number", { placeholder: "10" })
  const num2 = await arg("Second number", { placeholder: "5" })
  const operation = await arg("Operation", ["add", "subtract", "multiply", "divide"])

  let result
  switch(operation) {
    case "add": 
      result = Number(num1) + Number(num2)
      break
    case "subtract": 
      result = Number(num1) - Number(num2)
      break
    case "multiply": 
      result = Number(num1) * Number(num2)
      break
    case "divide": 
      result = Number(num1) / Number(num2)
      break
  }

  console.error(`${num1} ${operation} ${num2} = ${result}`)

  return {
    num1: Number(num1),
    num2: Number(num2),
    operation,
    result
  }
}

const result = await main()
console.log(JSON.stringify(result))
export default result