/**
 * Provides information about how the current script was launched
 */

export type LaunchContext = 'mcp' | 'http' | 'socket' | 'direct' | 'cli'

declare global {
  /**
   * The context in which the script was launched
   * - 'mcp': Launched via Model Context Protocol server
   * - 'http': Launched via HTTP server
   * - 'socket': Launched via Unix socket (sk)
   * - 'direct': Direct internal call
   * - 'cli': Command line (future)
   */
  var KIT_LAUNCH_CONTEXT: LaunchContext
  var _KIT_LAUNCH_CONTEXT_CACHE: LaunchContext | undefined
}

// Lazy getter that determines launch context on first access
Object.defineProperty(global, 'KIT_LAUNCH_CONTEXT', {
  get() {
    // Return cached value if already determined
    if (global._KIT_LAUNCH_CONTEXT_CACHE !== undefined) {
      return global._KIT_LAUNCH_CONTEXT_CACHE
    }
    
    // Determine launch context from headers
    const headers = global.headers || {}
    
    // Check the X-Kit-Launch-Context header set by handleScript
    if (headers['X-Kit-Launch-Context']) {
      global._KIT_LAUNCH_CONTEXT_CACHE = headers['X-Kit-Launch-Context'] as LaunchContext
    } else {
      // Fallback to 'direct' if no context header is present
      global._KIT_LAUNCH_CONTEXT_CACHE = 'direct'
    }
    
    return global._KIT_LAUNCH_CONTEXT_CACHE
  },
  enumerable: true,
  configurable: true
})