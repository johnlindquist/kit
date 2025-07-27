import { existsSync } from 'fs'
import { isAbsolute, normalize, resolve } from 'path'
import os from 'os'

export interface StackFrame {
  file: string
  line: number
  column: number
  function?: string
  isNative?: boolean
  isEval?: boolean
  isConstructor?: boolean
}

export interface FormattedError {
  message: string
  name: string
  stack: string
  frames: StackFrame[]
  originalStack?: string
}

export class SourcemapErrorFormatter {
  private static readonly STACK_FRAME_REGEX = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/
  private static readonly WINDOWS_PATH_REGEX = /^([a-zA-Z]:\\|\\\\)/
  private static readonly FILE_URL_REGEX = /^file:\/\/\/?/

  /**
   * Formats an error with enhanced stack trace information
   */
  static formatError(error: Error): FormattedError {
    const frames = this.parseStackTrace(error.stack || '')
    
    return {
      message: error.message,
      name: error.name,
      stack: this.formatStackTrace(frames, error),
      frames,
      originalStack: error.stack
    }
  }

  /**
   * Parses a stack trace string into structured frames
   */
  private static parseStackTrace(stack: string): StackFrame[] {
    const lines = stack.split('\n')
    const frames: StackFrame[] = []

    for (const line of lines) {
      const match = line.match(this.STACK_FRAME_REGEX)
      if (match) {
        const [, functionName, fileRaw, lineStr, columnStr] = match
        
        // Clean up file path
        let file = fileRaw
          .replace(this.FILE_URL_REGEX, '')
          .replace(/\?.*$/, '') // Remove query parameters
        
        // Handle Windows paths
        if (os.platform() === 'win32' && file.startsWith('/')) {
          // Convert /C:/path to C:/path on Windows
          file = file.substring(1)
        }
        
        // Normalize path for current platform
        file = normalize(file)
        
        frames.push({
          file,
          line: parseInt(lineStr, 10),
          column: parseInt(columnStr, 10),
          function: functionName || '<anonymous>',
          isNative: line.includes('native'),
          isEval: line.includes('eval'),
          isConstructor: line.includes('new ')
        })
      }
    }

    return frames
  }

  /**
   * Formats stack frames back into a readable stack trace
   */
  private static formatStackTrace(frames: StackFrame[], error: Error): string {
    const lines = [`${error.name}: ${error.message}`]
    
    for (const frame of frames) {
      // Skip node_modules and internal frames unless in verbose mode
      if (!process.env.KIT_ERROR_VERBOSE && this.shouldSkipFrame(frame)) {
        continue
      }
      
      const location = `${frame.file}:${frame.line}:${frame.column}`
      const functionPart = frame.function !== '<anonymous>' 
        ? `${frame.function} (${location})` 
        : location
        
      lines.push(`    at ${functionPart}`)
    }
    
    return lines.join('\n')
  }

  /**
   * Determines if a frame should be skipped in the output
   */
  private static shouldSkipFrame(frame: StackFrame): boolean {
    const skipPatterns = [
      /node_modules/,
      /internal\/modules/,
      /internal\/process/,
      /internal\/timers/
    ]
    
    return skipPatterns.some(pattern => pattern.test(frame.file))
  }

  /**
   * Extracts error location for the error prompt
   */
  static extractErrorLocation(error: Error): { file: string; line: number; column: number } | null {
    const formatted = this.formatError(error)
    
    // Find first non-internal frame
    const relevantFrame = formatted.frames.find(frame => 
      !this.shouldSkipFrame(frame) && 
      existsSync(frame.file)
    )
    
    if (relevantFrame) {
      return {
        file: relevantFrame.file,
        line: relevantFrame.line,
        column: relevantFrame.column
      }
    }
    
    return null
  }

  /**
   * Validates and resolves a file path
   */
  static resolveFilePath(filePath: string, basePath?: string): string | null {
    try {
      // Remove file:// protocol if present
      let cleanPath = filePath.replace(this.FILE_URL_REGEX, '')
      
      // Handle Windows paths
      if (os.platform() === 'win32' && cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1)
      }
      
      // Resolve relative paths
      const resolvedPath = isAbsolute(cleanPath) 
        ? normalize(cleanPath)
        : resolve(basePath || process.cwd(), cleanPath)
      
      // Check if file exists
      if (existsSync(resolvedPath)) {
        return resolvedPath
      }
      
      // Try with .ts extension if .js doesn't exist
      const tsPath = resolvedPath.replace(/\.js$/, '.ts')
      if (existsSync(tsPath)) {
        return tsPath
      }
      
      // Try with .tsx extension
      const tsxPath = resolvedPath.replace(/\.js$/, '.tsx')
      if (existsSync(tsxPath)) {
        return tsxPath
      }
      
      return null
    } catch (error) {
      return null
    }
  }
}