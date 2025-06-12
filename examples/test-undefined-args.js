// Test script to demonstrate the __undefined__ feature
// 
// Usage examples:
// 1. All interactive: kit test-undefined-args
// 2. All pre-filled: kit test-undefined-args "John" "30" "Engineer"
// 3. Mixed (age will prompt): kit test-undefined-args "John" "__undefined__" "Engineer"
// 4. First and last prompt: kit test-undefined-args "__undefined__" "30" "__undefined__"

import "@johnlindquist/kit"

console.log("Script Kit __undefined__ Test")
console.log("Arguments received:", args)
console.log("---")

// Get user information with three prompts
let name = await arg("What's your name?")
let age = await arg({
  prompt: "What's your age?",
  validate: (value) => {
    const num = parseInt(value)
    if (isNaN(num) || num < 1 || num > 150) {
      return "Please enter a valid age between 1 and 150"
    }
    return true
  }
})
let job = await arg("What's your job title?")

console.log("\nResults:")
console.log(`Name: ${name}`)
console.log(`Age: ${age}`)
console.log(`Job: ${job}`)

// Test with fields
console.log("\n--- Testing with fields ---")

// Reset args for fields test
global.args = ["Alice", "__undefined__", "alice@example.com", "__undefined__"]

let [firstName, lastName, email, phone] = await fields([
  { label: "First Name", value: "" },
  { label: "Last Name", value: "" },
  { label: "Email", value: "" },
  { label: "Phone", value: "" }
])

console.log("\nFields Results:")
console.log(`First Name: ${firstName}`)
console.log(`Last Name: ${lastName}`)
console.log(`Email: ${email}`)
console.log(`Phone: ${phone}`)

// Demonstrate the difference between empty string and __undefined__
console.log("\n--- Empty string vs __undefined__ ---")
global.args = ["", "__undefined__"]

let emptyTest = await arg("This should have empty string pre-filled")
let undefinedTest = await arg("This should show the prompt")

console.log(`Empty string arg: "${emptyTest}" (length: ${emptyTest.length})`)
console.log(`Undefined arg: "${undefinedTest}"`)