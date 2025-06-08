import ava from 'ava'
import slugify from 'slugify'
import { outputTmpFile } from './kit.js'
import { getProcessedScripts } from './kit.js'
import path from 'node:path'
import { readFile } from 'node:fs/promises'

ava('getProcessedScripts preserves longrunning property', async (t) => {
  const testScriptName = 'Test Longrunning Script'
  const fileName = slugify(testScriptName, { lower: true })
  
  const scriptContent = `
// Name: ${testScriptName}
// Description: A test script with longrunning property
// Longrunning: true

console.log("This is a long running script")
`

  // Create temporary test script
  const filePath = await outputTmpFile(`${fileName}.ts`, scriptContent)
  
  // Force cache refresh to include our new script
  const scripts = await getProcessedScripts(false)
  
  // Find our test script
  const testScript = scripts.find(s => s.filePath === filePath)
  
  // Verify the script was found and has longrunning property
  t.truthy(testScript, 'Test script should be found')
  t.is(testScript?.longrunning, true, 'longrunning property should be preserved as true')
  t.is(testScript?.name, testScriptName, 'Script name should match')
})

ava('getProcessedScripts handles longrunning: false correctly', async (t) => {
  const testScriptName = 'Test Short Script'
  const fileName = slugify(testScriptName, { lower: true })
  
  const scriptContent = `
// Name: ${testScriptName}
// Description: A test script with longrunning set to false
// Longrunning: false

console.log("This is a quick script")
`

  // Create temporary test script
  const filePath = await outputTmpFile(`${fileName}.ts`, scriptContent)
  
  // Force cache refresh to include our new script
  const scripts = await getProcessedScripts(false)
  
  // Find our test script
  const testScript = scripts.find(s => s.filePath === filePath)
  
  // Verify the script was found and has longrunning property set to false
  t.truthy(testScript, 'Test script should be found')
  t.is(testScript?.longrunning, false, 'longrunning property should be preserved as false')
})

ava('getProcessedScripts handles missing longrunning property', async (t) => {
  const testScriptName = 'Test Default Script'
  const fileName = slugify(testScriptName, { lower: true })
  
  const scriptContent = `
// Name: ${testScriptName}
// Description: A test script without longrunning property

console.log("This is a normal script")
`

  // Create temporary test script
  const filePath = await outputTmpFile(`${fileName}.ts`, scriptContent)
  
  // Force cache refresh to include our new script
  const scripts = await getProcessedScripts(false)
  
  // Find our test script
  const testScript = scripts.find(s => s.filePath === filePath)
  
  // Verify the script was found and longrunning is undefined
  t.truthy(testScript, 'Test script should be found')
  t.is(testScript?.longrunning, undefined, 'longrunning property should be undefined when not specified')
})

ava('getProcessedScripts preserves longrunning through the entire pipeline', async (t) => {
  const testScriptName = 'Test Pipeline Script'
  const fileName = slugify(testScriptName, { lower: true })
  
  const scriptContent = `
// Name: ${testScriptName}
// Description: Test the full pipeline preservation
// Longrunning: true
// Background: true

console.log("Testing full pipeline")
`

  // Create temporary test script
  const filePath = await outputTmpFile(`${fileName}.ts`, scriptContent)
  
  // Force cache refresh
  const scripts = await getProcessedScripts(false)
  
  // Find our test script
  const testScript = scripts.find(s => s.filePath === filePath)
  
  // Verify all properties are preserved
  t.truthy(testScript, 'Test script should be found')
  t.is(testScript?.longrunning, true, 'longrunning should be preserved')
  t.is(testScript?.background, true, 'background should be preserved')
  t.is(testScript?.name, testScriptName, 'name should match')
  
  // Verify the script object has the expected shape
  t.truthy(testScript?.filePath, 'Should have filePath')
  t.truthy(testScript?.command, 'Should have command')
})