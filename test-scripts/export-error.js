// mcp: error-test
// description: Test script that throws an error

const shouldError = await arg("Should throw error? (yes/no)")

if (shouldError.toLowerCase() === 'yes') {
  throw new Error("This is a test error")
}

export default {
  message: "No error thrown",
  shouldError
}