# Say API - Complete Flow Documentation

## Overview

The `say` API provides text-to-speech functionality, allowing scripts to speak text aloud using the system's speech synthesis capabilities. It leverages the Web Speech API through Electron's renderer process to provide cross-platform voice synthesis.

## API Signature

```typescript
say(text: string, options?: SayOptions): Promise<string>
```

### Parameters

- **text**: The text to speak aloud
- **options**: Optional configuration object
  - `rate`: Speech rate (default: 1.2 in SDK, 1.3 in renderer)
  - `name`: Voice name (default: "Daniel")
  - `pitch`: Voice pitch (default: 1)
  - `lang`: Language code (default: "en-US")

### Return Value

Returns a Promise that resolves to the original text when speech completes.

## Implementation Flow

### 1. SDK Implementation (sdk/src/lib/audio.ts)

The SDK provides a simple interface with sensible defaults:

```typescript
global.say = async (
  text,
  options = {
    rate: 1.2,
    name: "Daniel",
  }
) => {
  await sendWait(
    Channel.SPEAK_TEXT,
    {
      text,
      ...options,
    },
    0  // No timeout
  )
  return text
}
```

### 2. Message Transport

The say request flows through multiple layers:
1. SDK sends message via `Channel.SPEAK_TEXT`
2. Main process receives and forwards to renderer
3. Renderer process performs actual speech synthesis

### 3. Main Process Handler (app/src/main/messages.ts)

Routes the message to the renderer process:

```typescript
SPEAK_TEXT: async (p, value) => {
  // Forward to the prompt window
  await waitForPrompt(p.channel, p.value)
}
```

### 4. Renderer Process Implementation

The renderer uses Jotai atoms and the Web Speech API:

```typescript
// In jotai.ts - Speech atom
export const setSpeakAtom = atom(null, (get, set, text: string | SpeakOptions) => {
  const options = typeof text === 'string' ? { text } : text
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel()
  
  // Create utterance
  const utterance = new SpeechSynthesisUtterance(options.text)
  
  // Configure voice parameters
  utterance.rate = options.rate ?? 1.3
  utterance.pitch = options.pitch ?? 1
  utterance.lang = options.lang ?? 'en-US'
  
  // Set voice if specified
  if (options.name) {
    const voices = window.speechSynthesis.getVoices()
    const voice = voices.find(v => v.name.includes(options.name))
    if (voice) utterance.voice = voice
  }
  
  // Handle completion
  utterance.onend = () => {
    send(Channel.SPEAK_TEXT)  // Signal completion
  }
  
  // Start speaking
  window.speechSynthesis.speak(utterance)
})
```

### 5. Response Flow

1. Speech synthesis completes
2. `onend` callback triggers
3. Renderer sends completion signal
4. Main process receives signal
5. SDK promise resolves

## Platform-Specific Behavior

### Voice Availability
- **macOS**: Rich set of system voices (Alex, Samantha, Daniel, etc.)
- **Windows**: Microsoft voices (David, Zira, etc.)
- **Linux**: Depends on installed speech engines (espeak, festival)

### Voice Quality
- **macOS**: High-quality voices with natural intonation
- **Windows**: Good quality, varies by Windows version
- **Linux**: Basic quality, depends on engine

### Default Voices
- The default "Daniel" voice may not exist on all systems
- Falls back to system default if specified voice not found

## Complete Flow Diagram

```
Script              SDK                Main Process           Renderer            Speech API
  |                  |                     |                     |                    |
  |--say("Hello")--->|                     |                     |                    |
  |                  |--SPEAK_TEXT-------->|                     |                    |
  |                  |   {text:"Hello",    |                     |                    |
  |                  |    rate:1.2,        |                     |                    |
  |                  |    name:"Daniel"}   |                     |                    |
  |                  |                     |--waitForPrompt----->|                    |
  |                  |                     |                     |--setSpeakAtom----->|
  |                  |                     |                     |                    |
  |                  |                     |                     |--utterance-------->|
  |                  |                     |                     |    .speak()        |
  |                  |                     |                     |                    |
  |                  |                     |                     |<---speaking--------|
  |                  |                     |                     |                    |
  |                  |                     |                     |<---onend-----------|
  |                  |                     |<--SPEAK_TEXT--------|                    |
  |                  |<----complete---------|   (complete)       |                    |
  |<--"Hello"---------|                     |                     |                    |
```

## Important Considerations

### Side Effects
- **Audio Output**: Plays through system speakers
- **Speech Interruption**: Cancels any ongoing speech
- **System Volume**: Respects system volume settings
- **Focus**: Doesn't require app focus

### Timing and Performance
- **Async Operation**: Waits for speech to complete
- **No Timeout**: Uses sendWait with 0 timeout
- **Voice Loading**: First use may have slight delay
- **Rate Limits**: Speech rate typically 0.1 to 10

### Security Implications
- **Content**: Be careful with sensitive information
- **Volume**: Can't control system volume programmatically
- **Privacy**: Speech is audible to anyone nearby

### Known Limitations
- **Voice Selection**: Limited to available system voices
- **No Pause/Resume**: Can only cancel and restart
- **Queue Behavior**: New speech cancels ongoing speech
- **Language Support**: Depends on system configuration
- **No Audio File**: Can't save speech to file

## Usage Examples

### Basic Speech
```typescript
// Simple text
await say("Task completed successfully")

// With punctuation for natural pauses
await say("Hello, world! How are you today?")
```

### Custom Voice Settings
```typescript
// Slower speech rate
await say("Speaking slowly", {
  rate: 0.8
})

// Higher pitch
await say("Higher voice", {
  pitch: 1.5
})

// Different voice (macOS)
await say("British accent", {
  name: "Daniel"  // British voice on macOS
})
```

### Multi-language Support
```typescript
// Spanish
await say("Hola, ¿cómo estás?", {
  lang: "es-ES"
})

// French
await say("Bonjour le monde", {
  lang: "fr-FR"
})

// Japanese
await say("こんにちは", {
  lang: "ja-JP"
})
```

### Common Patterns
```typescript
// Status announcements
async function announceStatus(status: string) {
  await say(`Status update: ${status}`)
}

// Error announcements
async function announceError(error: Error) {
  await say(`Error: ${error.message}`, {
    rate: 0.9,  // Slower for clarity
    pitch: 0.8  // Lower pitch for seriousness
  })
}

// Progress updates
async function announceProgress(percent: number) {
  await say(`${percent} percent complete`)
}
```

### Script Feedback
```typescript
// Long-running task with audio feedback
await say("Starting download")

const result = await downloadFile(url)

if (result.success) {
  await say("Download complete")
} else {
  await say("Download failed", { pitch: 0.8 })
}
```

## Related APIs

### Complementary APIs
- **beep**: Simple audio alert without speech
- **notify**: Visual notifications
- **setStatus**: Silent status updates

### Alternative Approaches
- **Audio files**: Play pre-recorded audio
- **System sounds**: Use system alert sounds
- **External TTS**: Use cloud TTS services

### When to Use Which
- Use `say` for dynamic text announcements
- Use `beep` for simple attention-getting
- Use `notify` for visual alerts
- Use audio files for consistent voice/quality

## Advanced Usage

### Voice Detection
```typescript
// List available voices (in renderer context)
const voices = window.speechSynthesis.getVoices()
voices.forEach(voice => {
  console.log(`${voice.name} (${voice.lang})`)
})
```

### Speech Queuing Pattern
```typescript
// Since say cancels ongoing speech, queue manually
const speechQueue: string[] = []
let speaking = false

async function queueSpeech(text: string) {
  speechQueue.push(text)
  if (!speaking) {
    processSpeechQueue()
  }
}

async function processSpeechQueue() {
  speaking = true
  while (speechQueue.length > 0) {
    const text = speechQueue.shift()!
    await say(text)
  }
  speaking = false
}
```

### Accessibility Helper
```typescript
// Announce UI changes for accessibility
async function announceChange(element: string, newValue: string) {
  await say(`${element} changed to ${newValue}`, {
    rate: 1.1  // Slightly faster for UI updates
  })
}
```

## Best Practices

1. **Keep it Concise**: Short phrases are clearer
2. **Use Punctuation**: Helps with natural speech rhythm
3. **Test Voices**: Not all voices exist on all systems
4. **Consider Context**: Don't speak sensitive information
5. **Provide Options**: Let users disable speech
6. **Handle Errors**: Voice synthesis can fail
7. **Respect Preferences**: Some users prefer visual feedback

## Error Handling

```typescript
try {
  await say("Important message")
} catch (error) {
  // Fallback to visual notification
  console.error("Speech failed:", error)
  await notify("Important message")
}
```

## Debugging Tips

1. **Check Volume**: Ensure system volume is audible
2. **Test Voices**: Try without specifying voice name
3. **Simple First**: Start with plain text
4. **Console Logs**: Check renderer console for errors
5. **Platform Test**: Test on target platforms


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/app/src/main/(app/src/main/messages.ts,/workspace/app/src/main/messages.ts,/workspace/sdk/src/(sdk/src/lib/audio.ts,/workspace/sdk/src/lib/audio.ts"
```

This will generate a comprehensive report of all the implementation files for this API.