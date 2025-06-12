# Mic API - Script Kit Orientation

## Overview

The `mic` API provides audio recording functionality, allowing scripts to capture audio from the microphone. It returns audio data as a Buffer and includes streaming capabilities for real-time audio processing.

## Implementation Location

The `mic` function is defined in `/workspace/sdk/src/target/app.ts` at line 3386.

## Function Signatures

```typescript
// Main mic function - shows UI and records
global.mic = async (config?: MicConfig) => Promise<Buffer>

// Start recording without UI
global.mic.start = async (config?: MicConfig) => Promise<string>

// Stop recording
global.mic.stop = async () => Promise<Buffer>

// Access to audio stream
global.mic.stream: Readable | undefined
```

## Key Components

### MicConfig Type
```typescript
interface MicConfig extends PromptConfig {
  filePath?: string      // Custom file path for the recording
  timeSlice?: number     // Time slice for streaming chunks (default: 200ms)
}
```

### Return Values
- Main `mic()`: Returns a Buffer containing the recorded audio
- `mic.start()`: Returns the file path where audio is being saved
- `mic.stop()`: Returns a Buffer of the recorded audio
- `mic.stream`: Provides real-time access to audio chunks

## How It Works

1. **UI Display**: Shows a mic recording interface with a stop button
2. **Audio Capture**: Records audio in WebM format
3. **Streaming**: Optionally streams audio chunks in real-time
4. **File Storage**: Saves to a temporary file (can be customized)
5. **Buffer Return**: Returns the complete audio as a Buffer

## Internal Implementation Details

### Stream Management
- Creates a Node.js Readable stream for real-time audio access
- Handles stream lifecycle with proper cleanup
- Uses message passing between main process and recording process

### File Handling
- Default path: `tmp/mic-YYYY-MM-DD_HH-mm-ss.webm`
- Customizable via `filePath` option
- Automatic cleanup handled by Script Kit

## Usage Examples

### Basic Recording
```typescript
// Record audio and save to file
const buffer = await mic()
const audioPath = tmpPath("recording.webm")
await writeFile(audioPath, buffer)
await playAudioFile(audioPath)
```

### Custom File Path
```typescript
const buffer = await mic({
  filePath: home("Downloads", "my-recording.webm"),
  placeholder: "Recording... Click Stop when done"
})
```

### Streaming Audio
```typescript
// Start recording with streaming
mic.start()

// Process audio chunks in real-time
mic.stream.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes of audio`)
  // Process audio chunk here
})

// Stop recording when done
const finalBuffer = await mic.stop()
```

### With Custom UI Configuration
```typescript
const buffer = await mic({
  hint: "Speak clearly into your microphone",
  shortcuts: [
    {
      key: `${cmd}+s`,
      name: "Stop & Save",
      onPress: () => submit()
    }
  ]
})
```

### Voice Memo Script
```typescript
// Voice memo with transcription
const audioBuffer = await mic({
  placeholder: "Recording voice memo..."
})

// Save the audio
const memoPath = kitPath("memos", `memo-${Date.now()}.webm`)
await writeFile(memoPath, audioBuffer)

// Optional: Send to transcription service
const transcription = await transcribeAudio(audioBuffer)
await editor(transcription)
```

## Related Components

### Shortcuts
- `cmd+i`: Opens mic selection dialog
- `escape`: Cancels recording
- `enter`: Stops recording and saves

### Helper Scripts
- `cli/select-mic.js`: Allows selecting different microphone devices

## Common Use Cases

1. **Voice Notes**: Record quick audio memos
2. **Audio Commands**: Capture voice for speech-to-text processing
3. **Sound Recording**: Record system sounds or music
4. **Voice Authentication**: Capture voice samples for verification
5. **Audio Feedback**: Record user feedback in audio format

## Best Practices

1. **File Management**: Always clean up temporary audio files after use
2. **User Feedback**: Provide clear visual indicators during recording
3. **Error Handling**: Handle cases where microphone access is denied
4. **Format Consideration**: WebM format may need conversion for some uses
5. **Memory Usage**: Be mindful of buffer sizes for long recordings


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.