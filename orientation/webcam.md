# Webcam API - Script Kit Orientation

## Overview

The `webcam` API provides camera capture functionality, allowing scripts to take photos using the device's webcam. It presents a camera preview interface and returns the captured image as a base64-encoded string or buffer.

## Implementation Location

The `webcam` function is defined in `/workspace/sdk/src/target/app.ts` at line 3450.

## Function Signature

```typescript
global.webcam = async (options?: PromptConfig) => Promise<string>
```

## Key Components

### Parameters
- `options`: Optional `PromptConfig` object for customizing the camera interface

### Return Value
- Returns a base64-encoded string of the captured image

## How It Works

1. **UI Display**: Shows a webcam preview interface (`UI.webcam`)
2. **Camera Access**: Requests access to the device's camera
3. **Preview**: Displays live camera feed
4. **Capture**: User presses Enter to capture the current frame
5. **Return**: Returns the captured image as base64 data

## UI Configuration

The webcam prompt includes:
- Live camera preview
- Capture button (Enter key)
- Camera selection option (cmd+i)
- Standard escape/close shortcuts

## Usage Examples

### Basic Photo Capture
```typescript
// Capture a photo and save it
let base64Image = await webcam()
let buffer = Buffer.from(base64Image, 'base64')
let imagePath = tmpPath("photo.jpg")
await writeFile(imagePath, buffer)
await revealFile(imagePath)
```

### With Custom Prompt
```typescript
let photo = await webcam({
  placeholder: "Smile! Press Enter to capture",
  hint: "Make sure you're centered in the frame"
})
```

### Profile Picture Capture
```typescript
// Capture and save a profile picture
let profilePic = await webcam({
  placeholder: "Take your profile picture",
  hint: "Position your face in the center"
})

// Convert and save
let buffer = Buffer.from(profilePic, 'base64')
let profilePath = home("Pictures", "profile.jpg")
await writeFile(profilePath, buffer)

// Optionally resize or process the image
await resizeImage(profilePath, 200, 200)
```

### Document Scanner
```typescript
// Simple document scanner
let scanCount = 1
let scans = []

while (true) {
  let scan = await webcam({
    placeholder: `Scan page ${scanCount}`,
    hint: "Position document and press Enter"
  })
  
  scans.push(scan)
  
  let continueScanning = await arg("Scan another page?", [
    "Yes",
    "No, finish"
  ])
  
  if (continueScanning === "No, finish") break
  scanCount++
}

// Save all scans
for (let i = 0; i < scans.length; i++) {
  let buffer = Buffer.from(scans[i], 'base64')
  await writeFile(home("Documents", `scan-${i + 1}.jpg`), buffer)
}
```

### With Image Processing
```typescript
// Capture photo with effects
let rawPhoto = await webcam()

// Convert to buffer for processing
let buffer = Buffer.from(rawPhoto, 'base64')
let tempPath = tmpPath("temp-photo.jpg")
await writeFile(tempPath, buffer)

// Apply filters or effects (pseudo-code)
await applyFilter(tempPath, "black-and-white")
await addWatermark(tempPath, "Script Kit")

// Show the result
await showImage(tempPath)
```

## Related Components

### Shortcuts
- `cmd+i`: Opens webcam selection dialog (for multiple cameras)
- `escape`: Cancels capture
- `enter`: Captures the current frame
- `cmd+w`: Closes the webcam interface

### Helper Scripts
- `cli/select-webcam.js`: Allows selecting different camera devices

### Related APIs
- `getMediaDevices()`: Lists available cameras and microphones
- `screenshot()`: Captures screen instead of webcam
- `mic()`: Records audio instead of video

## Common Use Cases

1. **Profile Pictures**: Capture user avatars or profile photos
2. **Document Scanning**: Quick document or receipt capture
3. **ID Verification**: Capture ID cards or documents
4. **Video Messages**: Capture stills for video thumbnails
5. **QR Code Scanning**: Capture QR codes for processing
6. **Visual Feedback**: Capture user reactions or feedback

## Best Practices

1. **Privacy Notice**: Always inform users before accessing camera
2. **Image Format**: Handle base64 conversion properly
3. **File Size**: Be aware of image sizes, especially for storage
4. **Camera Selection**: Support multiple cameras when available
5. **Error Handling**: Handle camera permission denials gracefully

## Type Definitions

The webcam function uses the standard `PromptConfig` interface and is defined as:
```typescript
type WebCam = (config?: PromptConfig) => Promise<string>
```

Located in `/workspace/sdk/src/types/kitapp.d.ts` at line 145.


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/target/app.ts,/workspace/sdk/src/types/kitapp.d.ts"
```

This will generate a comprehensive report of all the implementation files for this API.