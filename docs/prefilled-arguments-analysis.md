# How Script Kit SDK Handles Pre-filled Arguments

## Overview

The Script Kit SDK provides a mechanism for pre-filling prompt values through the `global.args` array. When arguments are provided to a script (e.g., via command line or programmatically), prompt functions can automatically use these values instead of showing the interactive prompt.

## Key Components

### 1. Global Args Array

- `global.args`: An array that stores pre-filled arguments
- `global.updateArgs(arrayOfArgs)`: Function to update the args array using minimist parsing

### 2. Argument Checking Logic

All prompt functions follow a similar pattern for handling pre-filled arguments:

```typescript
// From basePrompt implementation
let firstArg = global.args.length ? global.args.shift() : null

if (typeof firstArg !== "undefined" && firstArg !== null) {
  let validate = (placeholderOrConfig as PromptConfig)?.validate

  if (typeof validate === "function") {
    let valid: boolean | string = await validate(firstArg)

    if (typeof valid === "boolean" && valid) return firstArg

    hint = typeof valid === "boolean" && !valid
      ? `${firstArg} is not valid`
      : (valid as string)
  } else {
    return firstArg
  }
}
```

## How It Works

### 1. Argument Consumption

- When a prompt function is called, it first checks if `global.args` has any values
- If args are available, it uses `args.shift()` to remove and use the first argument
- This ensures arguments are consumed in the order prompts appear in the script

### 2. Validation Support

- If a `validate` function is provided in the prompt config, the pre-filled value is validated
- If validation passes (returns `true`), the pre-filled value is returned immediately
- If validation fails:
  - For boolean `false`: Shows the prompt with a hint that the value is invalid
  - For string return: Shows the prompt with the custom error message as hint

### 3. Prompt Functions Supporting Pre-fill

Based on the code analysis, these prompt functions support pre-filled arguments:

- **`arg()`** / **`mini()`** - Basic text input
- **`textarea()`** - Multi-line text input
- **`editor()`** - Code editor
- **`select()`** - Multiple selection
- **`fields()`** - Form fields (each field consumes one argument)
- **`form()`** - Complete forms

### 4. Fields Function Special Handling

The `fields()` function has special handling for pre-filled values:

```typescript
if (global.args.length) {
  defaultElement.value = global.args.shift()
}
```

Each field in the form consumes one argument from the array in order.

## Examples

### Example 1: Simple Text Input
```javascript
// Script: get-name.js
let name = await arg("Enter your name")
console.log(`Hello, ${name}!`)

// Run with pre-filled argument:
// kit get-name "John Doe"
// Output: Hello, John Doe!
```

### Example 2: Multiple Prompts
```javascript
// Script: user-info.js
let name = await arg("Enter your name")
let age = await arg("Enter your age")
let city = await arg("Enter your city")

console.log(`${name}, ${age} years old, from ${city}`)

// Run with pre-filled arguments:
// kit user-info "Jane" "25" "New York"
// Output: Jane, 25 years old, from New York
```

### Example 3: With Validation
```javascript
// Script: validated-input.js
let email = await arg({
  placeholder: "Enter your email",
  validate: (value) => {
    if (!value.includes('@')) {
      return "Please enter a valid email"
    }
    return true
  }
})

console.log(`Email: ${email}`)

// Run with invalid pre-filled argument:
// kit validated-input "notanemail"
// Result: Shows prompt with hint "Please enter a valid email"

// Run with valid pre-filled argument:
// kit validated-input "user@example.com"
// Output: Email: user@example.com
```

### Example 4: Form Fields
```javascript
// Script: user-form.js
let result = await fields([
  { name: "firstName", label: "First Name" },
  { name: "lastName", label: "Last Name" },
  { name: "email", label: "Email" }
])

console.log(result)

// Run with pre-filled arguments:
// kit user-form "John" "Doe" "john@example.com"
// Result: All fields are pre-filled and form can be submitted immediately
```

## Special Cases

### 1. Undefined/Null Handling
- The check uses `typeof firstArg !== "undefined" && firstArg !== null`
- This allows empty strings to be valid pre-filled values
- Only truly undefined or null values trigger the prompt

### 2. Type Conversion
- Pre-filled arguments are passed as strings from command line
- Scripts need to handle type conversion if needed (e.g., `parseInt()` for numbers)

### 3. Choice-based Prompts
- For prompts with predefined choices (like `select()`), the pre-filled value should match one of the valid choices
- If it doesn't match, behavior depends on the prompt's strict mode

## Best Practices

1. **Document Expected Arguments**: Always document what arguments your script expects
2. **Validate Input**: Use the `validate` function to ensure pre-filled values meet requirements
3. **Provide Defaults**: Consider providing default values when arguments aren't supplied
4. **Order Matters**: Arguments are consumed in the order prompts appear in your script
5. **Type Safety**: Remember that command-line arguments are strings - convert as needed

## Implementation Notes

- The argument checking happens before any UI is shown
- If a valid pre-filled argument exists, the prompt function returns immediately
- This allows scripts to run completely non-interactively when all arguments are provided
- The system is designed to gracefully fall back to interactive mode when arguments are missing