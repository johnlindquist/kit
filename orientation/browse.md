# browse API

## Overview

The `browse` API opens URLs in the default web browser. It's a simple wrapper around the `open` function that provides a consistent interface for opening links.

## Function Definition

```typescript
global.browse = (url: string) => {
  return (global as any).open(url)
}
```

## Location
- **SDK Definition**: `/src/api/kit.ts` (line 2101)
- **Channel**: No specific channel - uses the system's `open` function directly
- **UI Type**: None - opens external browser

## How It Works

1. The `browse` function accepts a URL string as a parameter
2. It internally calls the global `open` function (which is provided by the SDK)
3. The system's default web browser opens with the specified URL

## Key Features

- **Simple API**: Just pass a URL string
- **System Integration**: Uses the operating system's default browser
- **External Process**: Opens browser outside of Script Kit

## Usage Examples

```javascript
// Open a website
await browse("https://google.com")

// Open documentation
await browse("https://scriptkit.com/docs")

// Open a specific GitHub issue
await browse("https://github.com/johnlindquist/kit/issues/123")
```

## Common Use Cases

1. **Opening documentation links** from within scripts
2. **Redirecting to web services** after authentication
3. **Showing external resources** like API docs or tutorials
4. **Opening generated reports** hosted online

## Notes

- The function returns immediately after launching the browser
- No feedback is provided about whether the URL opened successfully
- Works with any valid URL scheme (http://, https://, file://, etc.)
- The browser opens in a new window/tab based on system settings

## Repomix Command

To generate documentation for the browse API implementation:

```bash
cd ~/scriptkit && npx @repomix/cli --include "sdk/src/api/kit.ts"
```