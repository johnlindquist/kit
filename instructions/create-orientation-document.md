# Creating API Orientation Documents - Process Guide

## Overview
This document explains the systematic process for creating comprehensive API documentation by tracing the flow from SDK to App and back. Each API document should provide a complete understanding of how data flows through the Script Kit architecture.

## Process Steps

### 1. Initial Research - SDK Side

#### Find the API Definition
1. Search for the API function in the SDK directory
2. Common locations:
   - `sdk/src/lib/` - For utility functions
   - `sdk/src/target/app.ts` - For global objects and their methods
   - `sdk/src/api/` - For core API functions

#### Identify Key Components
- Function signature and parameters
- Default values and type definitions
- Channel(s) used for communication
- Dependencies (imports, other global functions)

#### Example Search Query
```
Search for the function implementation in the SDK directory. Look for:
1. The main function definition
2. Any imports or dependencies it uses
3. What channel it uses to communicate with the app
4. The payload structure it sends
```

### 2. Trace Communication Channels

#### Find Channel Definitions
- Check `sdk/src/core/enum.ts` for channel constants
- Note the exact channel name and any related channels

#### Understand Message Transport
- Locate `sendWait`, `sendWaitLong`, or `send` usage
- Check `sdk/src/api/kit.ts` for the `send` function implementation
- Understand the full message payload structure

### 3. App-Side Investigation

#### Find Channel Handlers
1. Search in `app/src/main/messages.ts` for the channel handler
2. Look for patterns like:
   - `CHANNEL_NAME: onChildChannel(...)`
   - `CHANNEL_NAME: onChildChannelOverride(...)`

#### Analyze Handler Implementation
- How the app processes the incoming message
- What system APIs or libraries are used (e.g., robotjs, Electron APIs)
- Platform-specific implementations
- Response sent back to SDK

#### Example Search Query
```
Search in the app directory for where the CHANNEL_NAME is handled. Look for:
1. The handler function that processes this channel
2. How it interacts with the system
3. What response it sends back to the SDK
4. Any platform-specific implementations
```

### 4. Document Structure

Each API documentation should include:

#### 1. Overview
- Brief description of what the API does
- Primary use cases

#### 2. API Signature
- TypeScript function signature
- Parameter descriptions
- Return value description

#### 3. Implementation Flow
- SDK implementation details
- Message transport mechanism
- App handler implementation
- Response flow back to SDK

#### 4. Platform-Specific Behavior
- Differences between macOS, Windows, Linux
- Limitations on certain platforms

#### 5. Complete Flow Diagram
- Visual representation of data flow
- Step-by-step process

#### 6. Important Considerations
- Side effects
- Timing/performance notes
- Security implications
- Known limitations

#### 7. Usage Examples
- Basic usage
- Advanced scenarios
- Integration with other APIs

#### 8. Related APIs
- Similar or complementary APIs
- When to use which API

## Key Patterns to Look For

### 1. Message Patterns
```javascript
// SDK side
await sendWait(Channel.CHANNEL_NAME, payload)

// App side
CHANNEL_NAME: onChildChannel(async ({ child }, { channel, value }) => {
  // Process
  childSend({ channel, value: result })
})
```

### 2. Platform Checks
```javascript
if (kitState.isMac) {
  // macOS specific
} else {
  // Windows/Linux
}
```

### 3. Library Usage
- `shims['@jitsi/robotjs']` - For keyboard/mouse automation
- `clipboard` - Electron's clipboard API
- `screen` - Electron's screen API

### 4. Debouncing
```javascript
debounce(handler, delay, { leading: true, trailing: false })
```

## Common Challenges and Solutions

### 1. Complex Multi-Step APIs
Some APIs like `getSelectedText` involve multiple steps:
- Document each step separately
- Show the complete flow
- Explain why each step is necessary

### 2. Platform Limitations
When APIs aren't supported on certain platforms:
- Clearly document which platforms are affected
- Explain why (missing libraries, OS limitations)
- Suggest alternatives if available

### 3. Timing and Delays
Many APIs involve delays or retries:
- Document all timing aspects
- Explain why delays are necessary
- Note impact on performance

### 4. Side Effects
APIs that modify system state (clipboard, mouse position):
- Clearly document all side effects
- Explain preservation/restoration mechanisms
- Warn about potential user impact

## Tools and Techniques

### 1. Use the Task Tool
For complex searches spanning multiple files, use the Task tool to:
- Find all references to a function
- Trace through multiple layers
- Understand the complete flow

### 2. Read Multiple Files Concurrently
When you need context from multiple files:
- Use concurrent Read operations
- Compare implementations across files
- Build a complete picture

### 3. Follow the Data
Always trace the complete path:
1. SDK function call
2. Channel message
3. App handler
4. System interaction
5. Response back to SDK

## Quality Checklist

Before completing an API document, ensure:
- [ ] All parameters are documented
- [ ] Return values are explained
- [ ] Platform limitations are noted
- [ ] Usage examples are provided
- [ ] Error cases are covered
- [ ] Performance implications are mentioned
- [ ] Related APIs are referenced
- [ ] Code snippets are accurate
- [ ] Flow is easy to follow

## Example References

Review these completed documents for reference:
- `setSelectedText.md` - Shows clipboard preservation pattern
- `getSelectedText.md` - Documents multi-step process
- `clipboard.md` - Comprehensive API with multiple methods
- `mouse.md` - Platform-specific implementation details

This systematic approach ensures consistent, thorough documentation that helps developers understand not just what an API does, but how it works internally.