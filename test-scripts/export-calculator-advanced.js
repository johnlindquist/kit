// mcp: calc
// description: Advanced calculator with multiple operations

const num1 = await arg("Enter first number")
const operation = await arg("Enter operation (+, -, *, /)")
const num2 = await arg("Enter second number")

const a = parseFloat(num1)
const b = parseFloat(num2)

let result = 0
let operationName = ""

switch (operation) {
  case '+':
    result = a + b
    operationName = "addition"
    break
  case '-':
    result = a - b
    operationName = "subtraction"
    break
  case '*':
    result = a * b
    operationName = "multiplication"
    break
  case '/':
    result = a / b
    operationName = "division"
    break
  default:
    throw new Error(`Invalid operation: ${operation}`)
}

export default {
  input: { num1: a, num2: b, operation },
  result,
  operationName,
  expression: `${a} ${operation} ${b} = ${result}`
}