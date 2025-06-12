# Wait/Sleep API - Script Kit Orientation

## Overview

The `wait` API provides a way to pause script execution for a specified duration. It's Script Kit's equivalent to `sleep` in other languages, creating a Promise-based delay that integrates well with async/await patterns.

## Implementation Locations

- **Core Implementation**: `/workspace/sdk/src/core/utils.ts` at line ~6500
- **Global Assignment**: `/workspace/sdk/src/api/global.ts` at line 85
- **App Override**: `/workspace/sdk/src/target/app.ts` at line 2662

## Function Signatures

```typescript
// Core implementation
export let wait = async (time: number): Promise<void> => 
  new Promise((res) => setTimeout(res, time))

// Global usage
global.wait = wait
```

## Key Components

### Parameters
- `time`: Duration to wait in milliseconds

### Return Value
- Returns a Promise that resolves after the specified time

## How It Works

1. **Promise-based**: Creates a Promise that resolves after the timeout
2. **Non-blocking**: Doesn't block the event loop
3. **Async-friendly**: Works seamlessly with async/await
4. **Precise timing**: Uses JavaScript's setTimeout internally

## Usage Examples

### Basic Delay
```typescript
// Wait for 1 second
await wait(1000)

// Wait for 500ms
await wait(500)
```

### Animation Sequences
```typescript
// Typewriter effect
let message = "Hello, Script Kit!"
for (let char of message) {
  await setInput(message.slice(0, message.indexOf(char) + 1))
  await wait(100) // 100ms between each character
}
```

### Polling Pattern
```typescript
// Poll for a condition
let isReady = false
let attempts = 0

while (!isReady && attempts < 10) {
  isReady = await checkCondition()
  
  if (!isReady) {
    await wait(1000) // Wait 1 second between checks
    attempts++
  }
}
```

### Progressive Delay
```typescript
// Exponential backoff
let retries = 0
let maxRetries = 5

while (retries < maxRetries) {
  try {
    await performOperation()
    break
  } catch (error) {
    retries++
    let delay = Math.pow(2, retries) * 1000 // 2s, 4s, 8s, etc.
    console.log(`Retry ${retries} after ${delay}ms`)
    await wait(delay)
  }
}
```

### User Feedback Timing
```typescript
// Show status messages with timing
await setStatus({
  status: "busy",
  message: "Initializing..."
})
await wait(1000)

await setStatus({
  status: "busy", 
  message: "Loading data..."
})
await wait(2000)

await setStatus({
  status: "success",
  message: "Complete!"
})
await wait(1500)
```

### Debouncing Actions
```typescript
// Simple debounce implementation
let debounceTimer
let debounce = async (fn, delay) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  
  await wait(delay)
  fn()
}

// Usage
await debounce(() => {
  console.log("Debounced action")
}, 300)
```

### Loading Simulation
```typescript
// Simulate loading with progress
for (let i = 0; i <= 100; i += 10) {
  await setProgress(i)
  await setHint(`Loading... ${i}%`)
  await wait(200)
}
```

### Timed Auto-submit
```typescript
// Auto-submit after delay
let result = await arg({
  placeholder: "Quick! You have 5 seconds!",
  onInit: async () => {
    await wait(5000)
    submit("timeout")
  }
})

if (result === "timeout") {
  await div(md(`# Time's up!`))
}
```

### Staggered Operations
```typescript
// Process items with delays
let items = ["A", "B", "C", "D", "E"]

for (let [index, item] of items.entries()) {
  await processItem(item)
  
  // Stagger by 500ms
  if (index < items.length - 1) {
    await wait(500)
  }
}
```

### Toast Notification Timing
```typescript
// Show multiple toasts with timing
let notifications = [
  "Starting process...",
  "Connecting to server...",
  "Downloading data...",
  "Processing...",
  "Complete!"
]

for (let notification of notifications) {
  await toast(notification)
  await wait(1500) // Show each for 1.5 seconds
}
```

## Common Patterns

### Wait with Condition
```typescript
// Wait until condition or timeout
async function waitUntil(condition, timeout = 5000) {
  let elapsed = 0
  let interval = 100
  
  while (elapsed < timeout) {
    if (await condition()) return true
    await wait(interval)
    elapsed += interval
  }
  
  return false
}

// Usage
let ready = await waitUntil(
  async () => await checkIfReady(),
  10000 // 10 second timeout
)
```

### Interruptible Wait
```typescript
// Wait that can be cancelled
let waiting = true
let waitPromise = wait(5000).then(() => {
  if (waiting) {
    console.log("Wait completed")
  }
})

// Cancel the wait effect
waiting = false
```

## Best Practices

1. **Avoid Long Waits**: Keep waits short for better UX
2. **User Feedback**: Show progress during waits
3. **Cancellation**: Consider if waits should be cancellable
4. **Error Handling**: Waits in loops should have exit conditions
5. **Performance**: Don't use wait for precise timing requirements

## Common Use Cases

1. **Animation**: Creating smooth transitions
2. **Polling**: Checking conditions periodically  
3. **Rate Limiting**: Preventing too-rapid API calls
4. **User Experience**: Giving users time to read messages
5. **Synchronization**: Coordinating async operations
6. **Testing**: Simulating delays or loading states

## Related APIs

- `setTimeout()`: Lower-level timer function
- `setInterval()`: For repeated delays
- `debounce()`: From lodash for debouncing
- `throttle()`: From lodash for throttling

## Note on "sleep"

Script Kit uses `wait` instead of `sleep` to follow JavaScript conventions. There is no separate `sleep` function - `wait` is the idiomatic way to pause execution in Script Kit.


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/api/global.ts,/workspace/sdk/src/core/utils.ts,/workspace/sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.