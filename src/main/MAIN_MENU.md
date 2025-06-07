# Script Kit Main Menu - Complex Scenarios Documentation

This document explains all the complex scenarios and interactions that can be triggered in the main menu (`src/main/index.ts`).

## Overview

The main menu is Script Kit's primary interface for launching scripts and handling various user interactions. It coordinates between three key components:

1. **`src/main/index.ts`** - The main menu orchestrator
2. **`src/run/app-prompt.ts`** - The app prompt handler that receives and processes user input
3. **`src/target/app.ts`** - The UI target that manages the actual prompt display and user interactions

## Core Architecture

### Entry Flow
1. The main menu is invoked via `mainMenu()` in `src/main/index.ts`
2. It sets up event handlers and waits for user input
3. When a selection is made, it determines the appropriate action through `runScript()`

### Key Components

#### Main Menu Configuration
```typescript
mainMenu({
  name: "Main",
  description: "Script Kit",
  placeholder: "Script Kit",
  enter: "Run",
  strict: false,
  flags: scriptFlags,
  shortcodes: { /* number handlers */ },
  actions,
  input: arg?.input || ""
})
```

## Complex Scenarios

### 1. Script Selection Scenarios

#### Regular Script Execution
- **Trigger**: User selects a normal script
- **Flow**: `runScript()` → `run(script.filePath)`
- **Code**: `src/main/index.ts:340-348`

#### App Launcher Mode
- **Trigger**: User selects an app or types `;` (semicolon)
- **Detection**: `isApp = state?.focused?.group === "Apps"` 
- **Flow**: `runScript()` → `open(script as string)`
- **Code**: `src/main/index.ts:206-213`

#### Password/Pass Mode
- **Trigger**: User selects a "Pass" group item
- **Detection**: `isPass = state?.focused?.group === "Pass"`
- **Flow**: Passes `--pass` flag with the input as `hardPass`
- **Code**: `src/main/index.ts:215-225`

### 2. Scriptlet Scenarios

#### Scriptlet Detection
- **Trigger**: Script has scriptlet properties
- **Detection**: `isScriptlet(script)` 
- **Flow**: `runScriptlet()` is imported and executed
- **Code**: `src/main/index.ts:321-326`

#### Scriptlet with Inputs
- **Trigger**: Scriptlet requires user inputs
- **Flow**: 
  1. Shows input prompts based on `choices[0].inputs`
  2. Collects inputs via `arg()`
  3. Passes to `runScriptlet(scriptlet, inputs, flag)`
- **Code**: `src/run/app-prompt.ts:140-159`

#### Scriptlet Tools
Scriptlets can use various tools (defined in `src/main/scriptlet.ts`):
- **`kit/ts/js`**: Executes as TypeScript/JavaScript
- **`transform`**: Transforms selected text
- **`template`**: Interactive template filling
- **`open/edit/paste/type/submit`**: System actions
- **Language tools**: `python`, `ruby`, `bash`, etc.

### 3. Snippet Scenarios

#### Snippet Execution
- **Trigger**: `isSnippet(script)` returns true
- **Flow**: 
  1. Stamps script via `send(Channel.STAMP_SCRIPT)`
  2. Runs paste-snippet app
- **Code**: `src/main/index.ts:311-319`

### 4. Background Script Toggle
- **Trigger**: Script has `background` property
- **Flow**: Runs `toggle-background.js` to enable/disable
- **Code**: `src/main/index.ts:300-305`

### 5. Shebang Scripts
- **Trigger**: Script has `shebang` property
- **Flow**: 
  1. Parses shebang with `parseShebang()`
  2. Sends to app via `sendWait(Channel.SHEBANG)`
- **Code**: `src/main/index.ts:335-338`

### 6. Quick Script Creation

#### No Matches Scenario
- **Trigger**: No scripts match user input
- **Detection**: `onNoChoices` callback
- **Flow**: 
  1. Validates input (no special characters)
  2. Suggests creating new script with sanitized name
  3. Shows panel with creation option
- **Code**: `src/main/index.ts:56-81`

#### Direct Creation
- **Trigger**: User submits non-matching string
- **Flow**: Runs `cli/new.js` with sanitized script name
- **Code**: `src/main/index.ts:246-252`

### 7. Flag-Based Actions

#### Script Flags
Various flags modify script behavior:
- **`--open`**: Opens script in editor instead of running
- **`--code`**: Opens script's kenv in VS Code
- **`--settings`**: Opens Kit settings
- **`--kenv-*`**: Various kenv operations
- **Modifier flags**: `opt`, `cmd`, `shift`, etc.

#### Flag Processing
- **Detection**: Checks `flag` object for active flags
- **Priority**: Non-modifier flags take precedence
- **Code**: `src/main/index.ts:254-294`

### 8. Shortcode Handlers

#### Number Keys (1-9)
- **Trigger**: User presses number keys
- **Handler**: `number-handler.ts`
- **Purpose**: Quick calculator access

#### Special Character Handlers
Currently commented out but available:
- `/` - Browse root
- `~` - Browse home
- `'` - Snippets
- `"` - Word API
- `:` - Emoji search
- `;` - App launcher
- `,` - Sticky note
- `.` - File search
- `<` - Clipboard history
- `?` - Docs

### 9. Keyword Scenarios

#### Keyword Detection
- **Trigger**: Script matches a keyword pattern
- **Flow**: 
  1. `onKeyword` callback triggered
  2. Preloads script
  3. Runs with `--keyword` flag
- **Code**: `src/main/index.ts:122-130`

### 10. Menu Toggle Actions

#### Dynamic Flag Loading
- **Trigger**: Menu toggled without active flag
- **Flow**: 
  1. Combines `scriptFlags` with action flags
  2. Updates available flags via `setFlags()`
- **Code**: `src/main/index.ts:113-121`

## State Management

### Focus State Tracking
The main menu tracks:
- `isApp` - Whether focused item is an app
- `isPass` - Whether focused item is a password entry
- `focused` - The currently focused choice object
- `input` - Current user input

### Choice Focus Events
- **Trigger**: User navigates choices
- **Handler**: `onChoiceFocus`
- **Updates**: `isApp`, `isPass`, and `focused` state

## Error Handling

### No Script Selected
- **Detection**: No script and no flags
- **Action**: Shows error prompt
- **Code**: `src/main/index.ts:191-199`

### Invalid Script Path
- **Detection**: Script string doesn't exist as file
- **Fallback**: Creates new script
- **Code**: `src/main/index.ts:240-252`

## Communication Channels

The system uses various channels for IPC:
- `Channel.STAMP_SCRIPT` - Records script usage
- `Channel.SHEBANG` - Handles shebang scripts
- `Channel.VALUE_SUBMITTED` - Receives user selections
- `Channel.HEARTBEAT` - Keeps connection alive

## Performance Optimization

### Preloading
- Scripts are preloaded when focused/selected
- Uses `preload(script.filePath)` for faster execution

### Trace Points
- `trace.instant()` calls mark key events
- Helps with performance monitoring

## Exit Scenarios

1. **User Cancellation**: ESC key or blur → `hide()` + `exit()`
2. **Successful Execution**: Script runs and completes
3. **Boolean False Return**: Script returns false → `exit()`
4. **No Selection + No Flags**: Error prompt shown

## Integration Points

### App Prompt Integration
`src/run/app-prompt.ts`:
- Receives script selection from main menu
- Handles "too early" scenarios
- Manages scriptlet execution with inputs

### App Target Integration
`src/target/app.ts`:
- Provides UI primitives (`kitPrompt`, `drop`, `emoji`, etc.)
- Manages prompt lifecycle
- Handles user interactions and validations