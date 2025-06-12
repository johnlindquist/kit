# handleScript - Script Execution and Argument Passing

## Overview

`handleScript` is the core function responsible for executing Script Kit scripts from the app layer. It manages the entire lifecycle of script execution, including passing arguments from the app to the SDK, where they can be consumed by prompt APIs. This document traces the complete flow of how arguments are passed and processed.

## API Signature

```typescript
// app/src/main/handleScript.ts
export const handleScript = async (
  filePath: string,
  args: string[] = [],
  cwd = '',
  verbose = false,
  trigger = '',
  triggerInfo: Partial<ProcessInfo> = {},
  ignoreBlur = false,
  force = false,
  fromPlugin = false,
  formData: any = null
): Promise<ScriptResult>
```

### Parameters
- `filePath`: Absolute path to the script file
- `args`: Array of string arguments to pass to the script
- `cwd`: Working directory for script execution
- `verbose`: Enable verbose logging
- `trigger`: Source that triggered the script (e.g., 'menu', 'hotkey')
- `triggerInfo`: Additional metadata about the trigger
- `ignoreBlur`: Whether to ignore blur events
- `force`: Force execution even if script is already running
- `fromPlugin`: Whether script was triggered from a plugin
- `formData`: Optional form data to pass to script

## Implementation Flow

### 1. SDK Implementation Details

#### Argument Pre-processing (app/src/main/handleScript.ts:28)
```typescript
// Replace newline placeholders with actual newlines
args = args.map((s: string) => s.replaceAll('$newline$', '\n'))
```

#### Script Execution Call
```typescript
const result = await runPromptProcess(filePath, args, {
  force,
  trigger,
  sponsorCheck,
  cwd,
  verbose,
  ignoreBlur,
  fromPlugin,
  formData,
})
```

### 2. Message Transport Mechanism

#### Adding Metadata to Arguments (app/src/main/kit.ts:376)
```typescript
const argsWithTrigger = [
  ...args,
  '--trigger', options?.trigger,
  '--force', options?.force ? 'true' : 'false',
  '--cwd', options?.cwd || '',
];
```

#### IPC Message Structure
```typescript
child?.send({
  channel: Channel.VALUE_SUBMITTED,
  input: '',
  value: {
    script: promptScriptPath,
    args: argsWithTrigger,
    trigger: options?.trigger,
    ui: UI.arg,
    name: path.basename(promptScriptPath),
    description: filePath,
    log,
    hasPreview: false,
    ignoreBlur: options?.ignoreBlur,
    fromPlugin: options?.fromPlugin,
    formData: options?.formData,
  },
})
```

### 3. SDK Handler Implementation

#### Receiving Arguments (sdk/src/run/app-prompt.ts:146)
```typescript
process.on('message', async data => {
  if (data?.channel === Channel.VALUE_SUBMITTED) {
    args = data?.value?.args || []
    // Process received arguments
  }
})
```

#### Argument Processing (sdk/src/target/app.ts:1129)
```typescript
global.updateArgs = arrayOfArgs => {
  let argv = minimist(arrayOfArgs)
  global.args = [...argv._, ...global.args]  // Positional arguments
  global.argOpts = Object.entries(argv)
    .filter(([key]) => key != '_')
    .flatMap(([key, value]) => {
      if (typeof value === 'boolean' && value) return [`--${key}`]
      return [`--${key}`, value as string]
    })
  assignPropsTo(argv, global.arg)
  global.flag = { ...argv, ...global.flag }
}
```

### 4. Response Flow Back to SDK

#### Global Variables Available to Scripts
```typescript
// Positional arguments array
global.args: string[] = []  // e.g., ["John", "Doe", "1981"]

// Named arguments object (parsed by minimist)
global.arg: { [key: string]: any } = {}  // e.g., { name: "John", age: 30 }

// Alias for arg
global.flag: { [key: string]: any } = {}
```

## Platform-Specific Behavior

No platform-specific differences in argument handling. The mechanism works identically across macOS, Windows, and Linux.

## Complete Flow Diagram

```
1. User/System triggers script execution
   └─> handleScript(filePath, ["arg1", "arg2", "arg3"])
   
2. App Layer Processing
   └─> Replace $newline$ placeholders
   └─> Add metadata flags (--trigger, --force, --cwd)
   └─> Create IPC message with Channel.VALUE_SUBMITTED
   
3. IPC Transport
   └─> child.send() to SDK process
   
4. SDK Receives Message
   └─> Extract args from message.value.args
   └─> Call updateArgs() to process
   
5. Argument Parsing (minimist)
   └─> Positional args → global.args array
   └─> Named flags → global.arg/flag objects
   
6. Script Execution
   └─> Script accesses args[0], args[1], etc.
   └─> Or uses arg.flagName for named arguments
   
7. Prompt APIs Check Arguments
   └─> If args[0] exists, use it and shift()
   └─> Otherwise, show interactive prompt
```

## Important Considerations

### Argument Consumption by Prompts
When a script uses prompt APIs, arguments are consumed in order:
```typescript
// If run with: kit myscript "John" "30" "Engineer"
let name = await arg("Name?")      // Returns "John" without prompting
let age = await arg("Age?")        // Returns "30" without prompting  
let job = await arg("Job?")        // Returns "Engineer" without prompting
let city = await arg("City?")      // Shows prompt (no more args)
```

### Validation with Pre-filled Arguments
```typescript
let age = await arg({
  prompt: "Enter age",
  validate: (value) => {
    const num = parseInt(value)
    return num > 0 && num < 150
  }
})
// If pre-filled arg fails validation, prompt shows with error
```

### Empty vs Undefined Arguments
- Empty string `""` is a valid argument and will be used
- Only truly `undefined` or when array is exhausted will show prompt
- This distinction is crucial for the "__undefined__" feature being planned

## Usage Examples

### Basic Usage
```typescript
// Script: greet.js
let name = await arg("What's your name?")
let age = await arg("What's your age?")
console.log(`Hello ${name}, you are ${age} years old`)

// Run interactively:
// kit greet

// Run with arguments:
// kit greet "John" "30"
```

### Mixed Interactive/Non-interactive
```typescript
// Script with 3 prompts
let first = await arg("First name?")
let middle = await arg("Middle name?") 
let last = await arg("Last name?")

// Run with partial arguments:
// kit script "John"
// - First prompt skipped (uses "John")
// - Middle and last prompts shown interactively
```

### Form Fields with Arguments
```typescript
let [name, email, age] = await fields([
  { label: "Name", value: "" },
  { label: "Email", value: "" },
  { label: "Age", value: "" }
])

// Run with: kit script "John" "john@example.com" "30"
// All fields pre-filled, form submitted automatically
```

## Related APIs

### Prompt APIs Supporting Argument Pre-fill
- `arg()` / `mini()` - Basic text input
- `textarea()` - Multi-line text input
- `editor()` - Code editor
- `select()` / `multiSelect()` - Selection lists
- `fields()` - Multiple form fields
- `form()` - Complete forms
- `password()` - Password input (security note: avoid pre-filling)

### Argument Access APIs
- `global.args` - Raw positional arguments array
- `global.arg` / `global.flag` - Parsed named arguments
- `args.shift()` - Used internally by prompts to consume arguments

## Key Insights for "__undefined__" Feature

Based on this analysis, implementing the "__undefined__" feature would require:

1. **App Layer**: Pass "__undefined__" as a literal string in the args array
2. **SDK Prompt APIs**: Modify the argument checking logic to:
   ```typescript
   // Current logic:
   if (args[0]) {
     let input = args.shift()
     return input
   }
   
   // Modified logic:
   if (args.length > 0) {
     let input = args.shift()
     if (input === "__undefined__") {
       // Show prompt instead of using the value
       // Continue with normal prompt flow
     } else {
       return input
     }
   }
   ```

3. **Validation**: Ensure "__undefined__" triggers prompt even with validate function
4. **All Prompt Types**: Apply consistently across all prompt APIs

This approach would allow selective prompting while maintaining the ability to pre-fill other arguments in the sequence.


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/(app/src/main/handleScript.ts,/workspace/sdk/src/(app/src/main/kit.ts,/workspace/sdk/src/(sdk/src/run/app-prompt.ts,/workspace/sdk/src/(sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.