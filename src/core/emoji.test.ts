import ava from 'ava'
import { parseMetadata, postprocessMetadata } from './parser.js'
import type { ScriptMetadata } from '../types/core.js'

ava('parseMetadata should extract emoji from metadata comments', (t) => {
  const scriptContent = `
// Name: Test Script
// Description: A test script with emoji
// Emoji: 🚀

console.log("Hello from script")
`
  
  const metadata = parseMetadata(scriptContent)
  
  t.is(metadata.name, 'Test Script')
  t.is(metadata.description, 'A test script with emoji')
  t.is(metadata.emoji, '🚀')
})

ava('parseMetadata should handle multiple emojis', (t) => {
  const scriptContent = `
// Name: Multi Emoji Script
// Emoji: 🎉🎊🎈

console.log("Party time!")
`
  
  const metadata = parseMetadata(scriptContent)
  
  t.is(metadata.name, 'Multi Emoji Script')
  t.is(metadata.emoji, '🎉🎊🎈')
})

ava('postprocessMetadata should preserve emoji property', (t) => {
  const metadata = {
    name: 'Test Script',
    description: 'Test description',
    emoji: '💡'
  }
  
  const processed = postprocessMetadata(metadata, '')
  
  t.is(processed.emoji, '💡')
  t.is(processed.name, 'Test Script')
})

ava('postprocessMetadata should handle emoji with other metadata', (t) => {
  const metadata = {
    name: 'Complex Script',
    description: 'A script with various metadata',
    emoji: '🔧',
    shortcut: 'cmd shift t' as const,
    image: '~/images/test.png',
    background: true
  }
  
  const processed = postprocessMetadata(metadata, '')
  
  t.is(processed.emoji, '🔧')
  t.is(processed.name, 'Complex Script')
  t.truthy(processed.img) // Image gets processed to img
  t.is(processed.background, true)
  t.truthy(processed.shortcut)
})

ava('parseMetadata should handle emoji in exported metadata object', (t) => {
  const scriptContent = `
export const metadata = {
  name: "Exported Script",
  description: "Script with exported metadata",
  emoji: "🎯"
}

console.log("Script content")
`
  
  const metadata = parseMetadata(scriptContent)
  
  t.is(metadata.name, 'Exported Script')
  t.is(metadata.description, 'Script with exported metadata')
  t.is(metadata.emoji, '🎯')
})

ava('parseMetadata should prioritize exported emoji over comment emoji', (t) => {
  const scriptContent = `
// Name: Comment Script
// Emoji: 🌟

export const metadata = {
  name: "Exported Script",
  emoji: "🎯"
}

console.log("Script content")
`
  
  const metadata = parseMetadata(scriptContent)
  
  // Exported metadata should override comment metadata
  t.is(metadata.name, 'Exported Script')
  t.is(metadata.emoji, '🎯')
})