import ava from 'ava'
import { parseMetadata, postprocessMetadata } from './parser.js'
import { ProcessType } from './enum.js'

ava('parseMetadata handles longRunning: true', (t) => {
  const fileContents = `
// Name: Long Running Script
// Description: This script runs for a long time
// LongRunning: true

console.log("This is a long running script")
`

  const metadata = parseMetadata(fileContents)
  
  t.is(metadata.name, 'Long Running Script')
  t.is(metadata.description, 'This script runs for a long time')
  t.is(metadata.longRunning, true)
  t.is(metadata.type, ProcessType.Prompt)
})

ava('parseMetadata handles longRunning: false', (t) => {
  const fileContents = `
// Name: Quick Script
// LongRunning: false

console.log("This is a quick script")
`

  const metadata = parseMetadata(fileContents)
  
  t.is(metadata.name, 'Quick Script')
  t.is(metadata.longRunning, false)
})

ava('parseMetadata handles missing longRunning', (t) => {
  const fileContents = `
// Name: Normal Script

console.log("This is a normal script")
`

  const metadata = parseMetadata(fileContents)
  
  t.is(metadata.name, 'Normal Script')
  t.is(metadata.longRunning, undefined)
})

ava('postprocessMetadata converts longRunning string to boolean', (t) => {
  const metadata: any = {
    name: 'Test Script',
    longRunning: 'true'
  }
  
  const processed = postprocessMetadata(metadata, '')
  
  t.is(processed.longRunning, true)
})

ava('postprocessMetadata handles various longRunning values', (t) => {
  const testCases = [
    { input: 'true', expected: true },
    { input: 'false', expected: false },
    { input: true, expected: true },
    { input: false, expected: false },
    { input: 'TRUE', expected: true },
    { input: 'False', expected: false },
    { input: '  true  ', expected: true },
  ]
  
  testCases.forEach(({ input, expected }) => {
    const metadata: any = {
      name: 'Test Script',
      longRunning: input
    }
    
    const processed = postprocessMetadata(metadata, '')
    
    t.is(processed.longRunning, expected, `longRunning: ${input} should become ${expected}`)
  })
})

ava('longRunning works with other metadata properties', (t) => {
  const fileContents = `
// Name: Complex Script
// Description: A script with multiple metadata
// Background: true
// LongRunning: true
// Schedule: */5 * * * *

console.log("Complex script")
`

  const metadata = parseMetadata(fileContents)
  
  t.is(metadata.name, 'Complex Script')
  t.is(metadata.description, 'A script with multiple metadata')
  t.is(metadata.background, true)
  t.is(metadata.longRunning, true)
  t.is(metadata.schedule, '*/5 * * * *')
  t.is(metadata.type, ProcessType.Schedule) // Schedule takes precedence
})