# Form API Orientation

## Overview
The `form` API creates multi-field HTML forms for structured data input. It provides a flexible way to collect complex user input through standard HTML form elements that are rendered in the Script Kit Electron app.

## Main Function Definition
Located in `sdk/src/target/app.ts`:

```typescript
global.form = async (
  html = "",
  formData = {},
  actions?: Action[]
) => {
  let config: PromptConfig = {}
  if ((html as PromptConfig)?.html) {
    config = html as PromptConfig
    config.formData = formData
  } else {
    config = {
      html: html as string,
      formData,
    }
  }

  config.ui = UI.form
  if (typeof config.enter !== "string") {
    config.enter = "Submit"
  }
  config.shortcuts ||= formShortcuts
  config.actions ||= actions

  return await global.kitPrompt(config)
}
```

## Channel/UI Type
- **UI Type**: `UI.form`
- **Channel**: `SET_FORM` (main channel for setting form configuration)
- **Channel**: `SET_FORM_DATA` (for updating form data dynamically)
- **Channel**: `SET_DISABLE_SUBMIT` (for enabling/disabling submit)
- **Channel**: `VALUE_SUBMITTED` (for form submission)

## How It Differs from Similar APIs
- **vs `arg`**: Form allows multiple structured inputs vs single input
- **vs `fields`**: Form takes raw HTML vs field configuration objects
- **vs `div`**: Form is interactive and returns data vs display-only

## Key Features

### 1. HTML-Based Forms
```javascript
// Create a form with custom HTML
let result = await form(`
  <form>
    <input name="username" type="text" placeholder="Username">
    <input name="password" type="password" placeholder="Password">
    <button type="submit">Login</button>
  </form>
`)
```

### 2. Pre-populated Form Data
```javascript
// Pre-fill form fields
let result = await form(
  `<form>
    <input name="name" type="text">
    <input name="email" type="email">
  </form>`,
  { name: "John", email: "john@example.com" }
)
```

### 3. With Actions
```javascript
// Add action buttons
let result = await form(
  `<form>...</form>`,
  {},
  [
    { name: "Import", onAction: async () => { /* ... */ } },
    { name: "Export", onAction: async () => { /* ... */ } }
  ]
)
```

## Configuration Options

### Through PromptConfig
```javascript
let result = await form({
  html: `<form>...</form>`,
  formData: { field1: "value1" },
  enter: "Submit",  // Submit button text
  placeholder: "Fill out the form",
  shortcuts: [/* custom shortcuts */]
})
```

### Helper Functions
- `setFormData(data)` - Update form data dynamically
- `setDisableSubmit(disable)` - Enable/disable submit button

## Best Practices
1. Use semantic HTML form elements
2. Include proper `name` attributes for form fields
3. Handle form validation in `onSubmit` handler
4. Use `type` attributes for proper input handling
5. Consider accessibility with labels

## Common Use Cases
- Login/authentication forms
- Configuration dialogs
- Multi-field data entry
- Settings interfaces
- Survey/questionnaire forms

## Implementation Details

### Form Rendering Process

1. **SDK Side** (`sdk/src/target/app.ts:1517`):
   - `global.form` creates a PromptConfig with `ui: UI.form`
   - Sends configuration to app via `kitPrompt`
   - Automatically sets enter button text to "Submit" if not specified

2. **Main Process** (`app/src/main/messages.ts`):
   - `SET_FORM` handler receives form configuration and forwards to renderer
   - `SET_FORM_DATA` updates form field values dynamically
   - Previously had `SET_FORM_HTML` (now commented out)

3. **Renderer Process** (`app/src/renderer/src/components/form.tsx`):
   - React component that renders the form HTML using `html-react-parser`
   - Manages form state through Jotai atoms:
     - `formHTMLAtom` - Stores the HTML string
     - `formDataAtom` - Stores initial form data object
     - `submitValueAtom` - Handles form submission
   - Form submission can be triggered by:
     - Submit button click
     - Enter key (when submit button exists)
     - Cmd/Ctrl+S or Cmd/Ctrl+Enter keyboard shortcuts

4. **Form HTML Processing** (`app/src/renderer/src/utils/state-utils.ts:122`):
   - `ensureFormHasSubmit` function automatically adds a hidden submit button if none exists
   - Ensures forms can always be submitted via keyboard

### Form Data Handling

The Form component (`form.tsx`) implements sophisticated data collection:

1. **Data Collection**:
   - Uses native FormData API to collect all form values
   - Handles single values (text, password, email, etc.)
   - Handles multi-value fields (checkboxes, multi-select)
   - Preserves field order based on element IDs

2. **Return Value Structure**:
   ```javascript
   {
     // Named field values
     fieldName1: "value1",
     fieldName2: ["value2a", "value2b"], // for multi-value fields
     
     // Ordered values array (preserves field order)
     orderedValues: ["value1", ["value2a", "value2b"], ...]
   }
   ```

3. **Form State Updates**:
   - `onChange` events trigger updates to ordered values
   - Form data can be updated dynamically via `SET_FORM_DATA`
   - Initial values populate from `formDataAtom`

### Keyboard Handling

Forms support these keyboard shortcuts:
- **Cmd/Ctrl+Enter**: Submit form
- **Cmd/Ctrl+S**: Submit form (save shortcut)
- **Tab**: Navigate between fields
- **Enter**: Submit (when a submit button exists)

### State Management

Forms use Jotai atoms for state management:
- `formHTMLAtom`: Stores the HTML template
- `formDataAtom`: Stores initial/current form data
- `submitValueAtom`: Complex atom that handles submission logic
- `changeAtom`: Handles form change events

### Special Features

1. **Auto-focus**: First form element automatically receives focus
2. **Form Reset**: Form resets when formData changes
3. **Multi-value Support**: Checkboxes and multi-selects return arrays
4. **File Inputs**: File paths are returned (not file contents)
5. **Ordered Values**: Results include an `orderedValues` array for sequential access

## Repomix Command

To analyze the complete form implementation, use:

```bash
repomix --include "sdk/src/target/app.ts,app/src/renderer/src/components/form.tsx,app/src/main/messages.ts,app/src/renderer/src/jotai.ts,app/src/renderer/src/utils/state-utils.ts,sdk/orientation/form.md"
```

This will generate a comprehensive report of all form-related implementation files.