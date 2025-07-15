await import("../lib/ai.js")
await import("../lib/audio.js")
await import("../lib/browser.js")
await import("../lib/desktop.js")
await import("../lib/file.js")
await import("../lib/keyboard.js")
await import("../lib/system.js")
await import("../lib/text.js")
await import("../lib/utils.js")
await import("../api/react.js")

// Import MCP after all core globals are initialized
await import("../lib/mcp.js")

export { }
