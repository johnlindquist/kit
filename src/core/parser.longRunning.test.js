import ava from 'ava'
import '../../test-sdk/config.js'
import { pathToFileURL } from 'node:url'

let importKit = async (...parts) => {
  let partsPath = path.resolve(process.env.KIT, ...parts)
  let importPath = pathToFileURL(partsPath).href
  return await import(importPath)
}

/** @type {import("./parser")} */
let { parseMetadata, postprocessMetadata } = await importKit('core', 'parser.js')

/** @type {import("./enum.js")} */
let { ProcessType } = await importKit('core', 'enum.js')

ava.serial('parseMetadata handles longRunning: true', (t) => {
  const fileContents = `
// Name: Long Running Script
// Description: This script runs for a long time
// Longrunning: true

console.log("This is a long running script")
`

  const metadata = parseMetadata(fileContents)
  
  t.is(metadata.name, 'Long Running Script')
  t.is(metadata.description, 'This script runs for a long time')
  t.is(metadata.longrunning, true)
  t.is(metadata.type, ProcessType.Prompt)
})

ava.serial('parseMetadata handles longRunning: false', (t) => {
  const fileContents = `
// Name: Quick Script
// Longrunning: false

console.log("This is a quick script")
`

  const metadata = parseMetadata(fileContents)
  
  t.is(metadata.name, 'Quick Script')
  t.is(metadata.longrunning, false)
})

ava.serial('parseMetadata handles missing longrunning', (t) => {
  const fileContents = `
// Name: Normal Script

console.log("This is a normal script")
`

  const metadata = parseMetadata(fileContents)
  
  t.is(metadata.name, 'Normal Script')
  t.is(metadata.longrunning, undefined)
})

ava.serial('postprocessMetadata converts longrunning string to boolean', (t) => {
  const metadata = {
    name: 'Test Script',
    longRunning: 'true'
  }
  
  const processed = postprocessMetadata(metadata, '')
  
  t.is(processed.longrunning, true)
})

ava.serial('postprocessMetadata handles various longrunning values', (t) => {
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
    const metadata = {
      name: 'Test Script',
      longRunning: input
    }
    
    const processed = postprocessMetadata(metadata, '')
    
    t.is(processed.longrunning, expected, `longRunning: ${input} should become ${expected}`)
  })
})

ava.serial('longrunning works with other metadata properties', (t) => {
  const fileContents = `
// Name: Complex Script
// Description: A script with multiple metadata
// Background: true
// Longrunning: true
// Schedule: */5 * * * *

console.log("Complex script")
`

  const metadata = parseMetadata(fileContents)
  
  t.is(metadata.name, 'Complex Script')
  t.is(metadata.description, 'A script with multiple metadata')
  t.is(metadata.background, true)
  t.is(metadata.longrunning, true)
  t.is(metadata.schedule, '*/5 * * * *')
  t.is(metadata.type, ProcessType.Schedule) // Schedule takes precedence
})