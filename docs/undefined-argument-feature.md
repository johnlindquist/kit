# The `__undefined__` Argument Feature

## Overview

The `__undefined__` feature allows you to selectively show prompts when running scripts with pre-filled arguments. When Script Kit encounters the special string `"__undefined__"` as an argument, it treats it as if no argument was provided for that position, causing the corresponding prompt to be displayed interactively.

## Use Cases

1. **Partial Automation**: Pre-fill some values while prompting for sensitive or variable data
2. **Template Scripts**: Create reusable scripts where certain values change each time
3. **Security**: Avoid passing passwords or sensitive data as command-line arguments
4. **Flexibility**: Mix automated and interactive inputs in a single script execution

## How It Works

When you pass arguments to a Script Kit script, they are normally consumed by prompts in order:

```javascript
// script.js
let name = await arg("Name?")      // Uses args[0]
let age = await arg("Age?")        // Uses args[1]  
let city = await arg("City?")      // Uses args[2]
```

With the `__undefined__` feature:
- Pass `"__undefined__"` to show the prompt instead of using the argument
- The prompt appears as if no argument was provided for that position
- Other arguments continue to work normally

## Examples

### Basic Example

```javascript
// greet.js
let name = await arg("What's your name?")
let age = await arg("What's your age?")
let city = await arg("What city?")

console.log(`${name}, ${age}, from ${city}`)
```

Run variations:
```bash
# All interactive
kit greet

# All pre-filled
kit greet "John" "30" "NYC"

# Only age is interactive
kit greet "John" "__undefined__" "NYC"

# Name and city are interactive
kit greet "__undefined__" "30" "__undefined__"
```

### With Validation

The `__undefined__` feature works with validation:

```javascript
let age = await arg({
  prompt: "Enter age",
  validate: (value) => {
    const num = parseInt(value)
    return num > 0 && num < 150 || "Invalid age"
  }
})
```

When `"__undefined__"` is passed, the prompt shows with validation active.

### With Form Fields

```javascript
let [first, last, email] = await fields([
  { label: "First Name" },
  { label: "Last Name" },
  { label: "Email" }
])
```

Run with:
```bash
# Last name will be in the form for user input
kit myform "John" "__undefined__" "john@example.com"
```

### Security Example

```javascript
// deploy.js
let server = await arg("Server?")
let username = await arg("Username?")
let password = await password("Password?")
let path = await arg("Deploy path?")
```

Safe execution:
```bash
# Password prompt appears interactively
kit deploy "prod.server.com" "admin" "__undefined__" "/var/www"
```

## Important Notes

1. **Case Sensitive**: Must be exactly `"__undefined__"` (not `"__UNDEFINED__"` or other variations)
2. **String Match**: It's matched as a string, so quotes are needed in shells
3. **Empty String**: Empty string `""` is different from `"__undefined__"` - empty strings are valid values
4. **Position Matters**: Arguments are consumed in order, so position must match the prompt sequence
5. **Works Everywhere**: Supported in both app and terminal contexts

## Implementation Details

The feature is implemented at the core prompt level:
- In `basePrompt` for app context (`sdk/src/target/app.ts`)
- In `arg` for terminal context (`sdk/src/target/terminal.ts`)
- In `fields` for form field pre-filling

When an argument is consumed, it's checked for the exact string `"__undefined__"`. If matched, the argument is treated as `null`, causing the prompt to display.

## Comparison Table

| Argument Value | Behavior |
|----------------|----------|
| `"John"` | Uses "John" as the value |
| `""` | Uses empty string as the value |
| `"__undefined__"` | Shows the interactive prompt |
| No argument | Shows the interactive prompt |
| `" __undefined__"` | Uses " __undefined__" as value (extra space) |
| `"__UNDEFINED__"` | Uses "__UNDEFINED__" as value (wrong case) |

## Advanced Patterns

### Conditional Prompting
```javascript
// Only prompt for email if not provided or __undefined__
let email = await arg("Email?")
if (email && email !== "__undefined__") {
  // Use the email
}
```

### Dynamic Forms
```javascript
// Build form fields based on which args are __undefined__
let formFields = []
if (args[0] === "__undefined__") formFields.push({ label: "Name" })
if (args[1] === "__undefined__") formFields.push({ label: "Email" })
// ... etc
```

### Template Scripts
```bash
# Create an alias for common patterns
alias deploy-staging='kit deploy staging-server myuser "__undefined__" /opt/app'
```

This feature enhances Script Kit's flexibility by allowing fine-grained control over which prompts appear during execution while maintaining the benefits of argument pre-filling.