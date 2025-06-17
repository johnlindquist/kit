import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { Channel } from '../core/enum.js'

// Content types based on MCP spec
interface TextContent {
  type: 'text'
  text: string
}

interface ImageContent {
  type: 'image'
  data: string // base64-encoded
  mimeType: string
}

interface AudioContent {
  type: 'audio'
  data: string // base64-encoded
  mimeType: string
}

interface ResourceContent {
  type: 'resource'
  resource: {
    uri: string
    mimeType?: string
    text?: string
    blob?: string // base64-encoded
  }
}

// Union of all content types
type ContentItem = TextContent | ImageContent | AudioContent | ResourceContent

// Additional result options
interface ResultOptions {
  isError?: boolean
  structuredContent?: Record<string, unknown>
  _meta?: Record<string, unknown>
}

// Result object combines content with options
type ResultObject = ContentItem & ResultOptions

// Main function overloads
export function sendResult(content: string): Promise<void>
export function sendResult(content: ResultObject): Promise<void>
export function sendResult(content: ContentItem[]): Promise<void>

export async function sendResult(
  content: string | ResultObject | ContentItem[]
): Promise<void> {
  let toolResult: CallToolResult
  
  if (typeof content === 'string') {
    // Simple string - wrap as text content
    toolResult = {
      content: [{
        type: 'text',
        text: content
      }]
    }
  } else if (Array.isArray(content)) {
    // Array of content items
    toolResult = {
      content: content as any
    }
  } else {
    // Single object - extract type and options
    const { type, isError, structuredContent, _meta, ...contentData } = content as ResultObject & { type: string }
    
    // Build content item based on type
    const contentItem: ContentItem = { type, ...contentData } as ContentItem
    
    // Build result with options
    toolResult = {
      content: [contentItem] as any
    }
    
    if (isError !== undefined) toolResult.isError = isError
    if (structuredContent !== undefined) toolResult.structuredContent = structuredContent
    if (_meta !== undefined) toolResult._meta = _meta
  }
  
  // Send via MCP channel
  await global.sendWait(Channel.RESPONSE, {
    body: toolResult,
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// Export types for users
export type {
  TextContent,
  ImageContent,
  AudioContent,
  ResourceContent,
  ContentItem,
  ResultObject,
  ResultOptions
}