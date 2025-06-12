# Fields API Orientation

## Overview
The `fields` API creates a structured key-value field editor with automatic form generation.

## Main Function Definition
Located in `/workspace/sdk/src/target/app.ts`:

```typescript
global.fields = async (formFields, actions?: Action[]) => {
  // Generates form fields from configuration
  // Returns array of values in field order
}
```

## Channel/UI Type
- **UI Type**: `UI.form` (uses form UI internally)
- **Channel**: Same as form API but with auto-generated HTML

## How It Differs from Similar APIs
- **vs `form`**: Fields auto-generates HTML from config vs raw HTML
- **vs `arg`**: Fields handles multiple inputs vs single input
- **vs `editor`**: Fields is for structured data vs freeform text

## Key Features

### 1. Simple String Fields
```javascript
// Basic field names as strings
let [username, password] = await fields([
  "Username",
  "Password"
])
```

### 2. Field Configuration Objects
```javascript
// Detailed field configuration
let [name, age, email] = await fields([
  {
    label: "Full Name",
    placeholder: "Enter your name",
    value: "John Doe"  // Default value
  },
  {
    label: "Age",
    type: "number",
    min: 0,
    max: 150
  },
  {
    label: "Email",
    type: "email",
    required: true
  }
])
```

### 3. HTML Element Types
```javascript
// Different input elements
let values = await fields([
  { element: "input", type: "text", label: "Text Input" },
  { element: "textarea", label: "Comments", rows: 5 },
  { element: "select", label: "Choice", options: ["A", "B", "C"] }
])
```

### 4. With Actions
```javascript
// Add custom actions
let values = await fields(
  ["Field 1", "Field 2"],
  [
    { name: "Reset", onAction: async () => { /* ... */ } },
    { name: "Load Defaults", onAction: async () => { /* ... */ } }
  ]
)
```

## Field Configuration Options

### Common Properties
- `label` - Field label text
- `placeholder` - Placeholder text
- `value` - Default value
- `type` - Input type (text, number, email, etc.)
- `required` - Make field required
- `id` - Field ID
- `name` - Field name attribute

### Auto-population from Args
Fields automatically use command line arguments if available:
```javascript
// If script called with: script.js value1 value2
let [field1, field2] = await fields(["Field 1", "Field 2"])
// field1 = "value1", field2 = "value2"
```

## Return Value
Returns an array of values in the same order as fields:
```javascript
let [first, second, third] = await fields([
  "First Field",
  "Second Field", 
  "Third Field"
])
```

## Generated Form Structure
Fields generates semantic HTML with:
- Proper labels associated with inputs
- Consistent styling and spacing
- Keyboard navigation support
- Auto-focus on first field

## Best Practices
1. Use descriptive labels for clarity
2. Set appropriate input types for validation
3. Provide placeholders for complex fields
4. Use field objects for advanced configuration
5. Consider field order for logical flow

## Common Use Cases
- Quick data collection forms
- Configuration wizards
- Multi-parameter script inputs
- Database record creation
- API credential collection


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.