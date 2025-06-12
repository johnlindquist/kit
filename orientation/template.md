# template API Orientation

## Overview

The `template` API provides an interactive text editor with template variables that users can tab through and fill in. It's perfect for creating structured documents, code snippets, or any text that follows a pattern.

## Core Concepts

### Template Variables
```javascript
// Basic template with numbered variables
let text = await template(`Hello $1!`)
// User types "World" → "Hello World!"

// Multiple variables
let letter = await template(`
Dear $1,

Thank you for $2.

Sincerely,
$3
`)
```

### Variables with Default Values
```javascript
let email = await template(`
To: \${1:recipient@example.com}
Subject: \${2:Important Update}
Message: \${3:Your message here}
`)
```

## Features

### 1. **Tab Navigation**
Users can press Tab to move between template variables, making it easy to fill in structured content quickly.

### 2. **Dynamic Replacement**
Variables can reference system values:
```javascript
let doc = await template(`
Author: $USER
Date: $DATE
Project: \${1:Project Name}

$SELECTION

Notes: \${2:Add notes here}
`)
// $USER → Current username
// $DATE → Current date
// $SELECTION → Currently selected text
```

### 3. **Clipboard Integration**
```javascript
let snippet = await template(`
// Original code:
$CLIPBOARD

// Modified version:
\${1:your changes}
`)
```

## Common Patterns

### 1. **Code Snippet Generation**
```javascript
// React component template
let component = await template(`
import React from 'react'

export function \${1:ComponentName}({ \${2:props} }) {
  return (
    <div>
      \${3:content}
    </div>
  )
}
`)

await writeFile(`\${1}.jsx`, component)
```

### 2. **Document Templates**
```javascript
// Meeting notes template
let notes = await template(`
# Meeting Notes - $DATE

**Attendees:** \${1:names}
**Topic:** \${2:meeting topic}

## Agenda
\${3:- Item 1}

## Action Items
\${4:- [ ] Task 1}

## Next Steps
\${5:follow-up items}
`)

await writeFile(`meeting-${Date.now()}.md`, notes)
```

### 3. **Configuration Files**
```javascript
// Generate config file
let config = await template(`
{
  "name": "\${1:project-name}",
  "version": "\${2:1.0.0}",
  "description": "\${3:A new project}",
  "main": "\${4:index.js}",
  "author": "$USER",
  "license": "\${5:MIT}"
}
`)

await writeFile("package.json", config)
```

### 4. **Email Templates**
```javascript
// Customer response template
let response = await template(`
Hi \${1:Customer Name},

Thank you for reaching out about \${2:issue/topic}.

\${3:Your detailed response here}

Please let me know if you need any clarification.

Best regards,
$USER
\${4:Company Name}
`)

await copy(response) // Copy to clipboard
```

## Options Parameter

```javascript
// Specify editor language for syntax highlighting
let code = await template(`
function \${1:functionName}(\${2:params}) {
  \${3:// implementation}
}
`, {
  language: "javascript"
})

// Other editor options
let template = await template("content", {
  language: "markdown",
  fontSize: 14,
  wordWrap: "on"
})
```

## System Variables

The template system recognizes several special variables:

- `$USER` - Current system username
- `$HOME` - Home directory path
- `$CLIPBOARD` - Current clipboard content
- `$SELECTION` - Currently selected text (if any)
- `$DATE` - Current date

## Best Practices

### 1. **Clear Variable Names**
```javascript
// Good - descriptive defaults
await template(`Name: \${1:Enter full name}`)

// Less clear
await template(`Name: $1`)
```

### 2. **Logical Tab Order**
```javascript
// Order variables by typical fill sequence
await template(`
From: \${1:your-email@example.com}
To: \${2:recipient@example.com}
Subject: \${3:Email subject}

\${4:Message body}
`)
```

### 3. **Provide Examples**
```javascript
// Help users with format examples
await template(`
Phone: \${1:+1 (555) 123-4567}
Date: \${2:YYYY-MM-DD}
Time: \${3:HH:MM AM/PM}
`)
```

## Integration Examples

### With File Operations
```javascript
// Create file from template
let content = await template(`
# \${1:Document Title}

## Overview
\${2:Brief description}

## Details
\${3:Main content}
`)

let filename = await arg("Save as:")
await writeFile(filename, content)
```

### With Clipboard
```javascript
// Generate and copy
let snippet = await template(`/* TODO: \${1:description} */`)
await copy(snippet)
```

## Related APIs

- **editor()** - For free-form text editing
- **arg()** - For simple text input
- **fields()** - For multiple structured inputs
- **md()** - Often used to preview template results

## Repomix Command

To generate documentation for the template API implementation:

```bash
cd ~/scriptkit && npx @repomix/cli --include "sdk/src/api/kit.ts"
```