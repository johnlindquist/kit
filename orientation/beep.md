# Beep API - Complete Flow Documentation

## Overview

The `beep` API provides a simple way to play the system beep sound. It's the most basic audio feedback mechanism in Script Kit, useful for alerts, notifications, or simple user feedback.

## API Signature

```typescript
beep(): Promise<void>
```

### Parameters

None - the beep function takes no parameters.

### Return Value

Returns a Promise that resolves when the beep request has been processed (not necessarily when the sound finishes playing).

## Implementation Flow

### 1. SDK Implementation (sdk/src/lib/audio.ts)

The SDK provides a minimal wrapper:

```typescript
global.beep = async () => {
  await sendWait(Channel.BEEP)
}
```

Key characteristics:
- No parameters or options
- Uses standard `sendWait` for IPC
- No timeout specified (uses default)

### 2. Message Transport

The beep request is sent via IPC:
- Channel: `Channel.BEEP`
- Payload: None (undefined)
- Synchronous confirmation via `sendWait`

### 3. App Handler Implementation (app/src/main/messages.ts)

The app delegates to Electron's shell API:

```typescript
BEEP: onChildChannel(({ child }, { channel, value }) => {
  shell.beep()
})
```

The handler:
- Receives the channel message
- Calls Electron's `shell.beep()`
- No response sent back (fire and forget)

### 4. System Integration

Electron's `shell.beep()` triggers the OS-specific beep:
- **macOS**: System alert sound (as configured in System Preferences)
- **Windows**: Default beep sound (SystemDefault)
- **Linux**: System beep (varies by distribution and configuration)

## Platform-Specific Behavior

### macOS
- Uses the alert sound selected in System Preferences → Sound → Sound Effects
- Respects system volume settings
- Can be customized by the user
- May be silent if alert volume is muted

### Windows
- Plays the Windows default beep sound
- Uses `MessageBeep(MB_OK)` internally
- Respects system sound scheme
- Can be disabled in sound settings

### Linux
- Behavior varies by distribution
- May use PC speaker, sound card, or be silent
- Often configured via PulseAudio or ALSA
- Some systems may not produce any sound

### Silent Failures
The beep may not produce sound if:
- System audio is muted
- Alert sounds are disabled
- No audio device is available
- Terminal beep is disabled (Linux)

## Complete Flow Diagram

```
Script              SDK                    IPC                    App                  System
  |                  |                      |                      |                     |
  |--beep()--------->|                      |                      |                     |
  |                  |--Channel.BEEP------->|                      |                     |
  |                  |  (no payload)        |                      |                     |
  |                  |                      |--onChildChannel----->|                     |
  |                  |                      |                      |--shell.beep()----->|
  |                  |                      |                      |                     |
  |                  |                      |<-----complete--------|                     |
  |<--returns--------|                      |                      |                     |
```

## Important Considerations

### Side Effects
- **Audio Output**: Plays through system speakers
- **User Interruption**: Can be startling if unexpected
- **System Dependency**: Sound depends on OS configuration
- **No Visual Feedback**: Audio-only feedback

### Timing and Performance
- **Async Operation**: Returns after request is sent
- **No Duration Control**: Can't control beep length
- **No Volume Control**: Uses system volume
- **Quick Response**: Minimal latency

### Security Implications
- **No Security Risks**: Simple system sound
- **No Data Exposure**: No parameters or data
- **User Control**: Users control system sounds

### Known Limitations
- **No Customization**: Can't change pitch, duration, or sound
- **No Guarantee**: May be silent on some systems
- **Single Sound**: Only one beep type available
- **No Repeat**: Must call multiple times for multiple beeps

## Usage Examples

### Basic Beep
```typescript
// Simple system beep
await beep()
```

### Success/Failure Feedback
```typescript
try {
  await performOperation()
  await beep() // Success beep
} catch (error) {
  // Consider using different feedback for errors
  await beep()
  await notify("Operation failed") // Additional context
}
```

### Multiple Beeps
```typescript
// Double beep pattern
async function doubleBeep() {
  await beep()
  await new Promise(resolve => setTimeout(resolve, 200))
  await beep()
}

// Triple beep for urgent attention
async function tripleBeep() {
  for (let i = 0; i < 3; i++) {
    await beep()
    if (i < 2) {
      await new Promise(resolve => setTimeout(resolve, 150))
    }
  }
}
```

### Conditional Beeping
```typescript
// Beep only if user has enabled audio feedback
const settings = await db('settings')
if (settings.audioFeedback) {
  await beep()
}
```

### Progress Indication
```typescript
// Beep at completion milestones
for (let i = 0; i < files.length; i++) {
  await processFile(files[i])
  
  // Beep every 10 files
  if ((i + 1) % 10 === 0) {
    await beep()
  }
}
await beep() // Final completion beep
```

## Related APIs

### Complementary APIs
- **say**: Text-to-speech for detailed audio feedback
- **notify**: Visual notifications with optional sound
- **playAudioFile**: Play custom audio files

### Alternative Approaches
- **Visual Feedback**: Use `div` or `notify` for silent environments
- **Custom Sounds**: Use `playAudioFile` for specific audio
- **Speech**: Use `say` for more informative audio feedback

### When to Use Which
- Use `beep` for simple, quick audio feedback
- Use `say` when you need to convey information
- Use `notify` for persistent visual feedback
- Use `playAudioFile` for custom sound effects

## Common Patterns

### Error Handling
```typescript
// Beep doesn't throw errors, but wrap for consistency
async function safeBeep() {
  try {
    await beep()
  } catch (error) {
    // Beep failed silently, use alternative feedback
    console.error('Beep failed:', error)
  }
}
```

### Beep Utilities
```typescript
// Create beep patterns
const beepPattern = {
  success: async () => {
    await beep()
  },
  
  warning: async () => {
    await beep()
    await sleep(100)
    await beep()
  },
  
  error: async () => {
    for (let i = 0; i < 3; i++) {
      await beep()
      await sleep(50)
    }
  }
}

// Usage
await beepPattern.success()
```

### User Preference Respect
```typescript
// Global audio feedback setting
let audioEnabled = true

async function audioFeedback() {
  if (audioEnabled) {
    await beep()
  }
}

// Let users toggle audio
const enableAudio = await arg('Enable audio feedback?', ['Yes', 'No'])
audioEnabled = enableAudio === 'Yes'
```

## Best Practices

1. **Use Sparingly**: Too many beeps can be annoying
2. **Provide Context**: Combine with visual feedback when possible
3. **Respect Preferences**: Allow users to disable audio
4. **Consider Environment**: Users may be in quiet settings
5. **Test on Target Platform**: Beep behavior varies by OS
6. **Have Fallbacks**: Don't rely solely on audio feedback
7. **Document Purpose**: Make clear why the script beeps

## Debugging Tips

1. **Check System Volume**: Ensure system isn't muted
2. **Test System Beep**: Try beep in system settings
3. **Platform Differences**: Test on actual target OS
4. **Alternative Feedback**: Always have visual backup
5. **Console Logging**: Log when beep is called

## Edge Cases

### Rapid Beeping
```typescript
// Some systems may merge rapid beeps
for (let i = 0; i < 5; i++) {
  await beep()
  // Add small delay to ensure distinct beeps
  await new Promise(resolve => setTimeout(resolve, 100))
}
```

### Silent Systems
```typescript
// Provide fallback for systems without audio
async function feedbackWithFallback(message: string) {
  await beep()
  // Always provide visual feedback too
  await notify(message)
}
```

### Cross-Platform Testing
```typescript
// Test beep behavior per platform
const platform = process.platform
await div(`Testing beep on ${platform}`)
await beep()
await div(`Did you hear the beep? Platform: ${platform}`)
```


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/app/src/main/(app/src/main/messages.ts,/workspace/app/src/main/messages.ts,/workspace/sdk/src/(sdk/src/lib/audio.ts,/workspace/sdk/src/lib/audio.ts"
```

This will generate a comprehensive report of all the implementation files for this API.