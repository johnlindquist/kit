import ava from 'ava'
import slugify from 'slugify'
import { getProcessedScripts } from './kit.js'
import { Script } from '../types/core.js'
import { kenvPath } from '../core/utils.js'
import { ensureDir, outputFile, remove } from 'fs-extra'
import { join } from 'path'

ava('getProcessedScripts preserves longRunning property', async (t) => {
  const testScriptName = 'Test Longrunning Script'
  const fileName = slugify(testScriptName, { lower: true })

  const scriptContent = `
// Name: ${testScriptName}
// Description: A test script with longRunning property
// longRunning: true

console.log("This is a long running script")
`

  // Ensure scripts directory exists
  await ensureDir(kenvPath('scripts'))
  
  // Create test script in the scripts directory
  const filePath = join(kenvPath('scripts'), `${fileName}.ts`)
  await outputFile(filePath, scriptContent)

  // Force cache refresh to include our new script
  const scripts = await getProcessedScripts(false) as Script[]

  // Find our test script
  const testScript = scripts.find(s => s.filePath === filePath)

  // Verify the script was found and has longRunning property
  t.truthy(testScript, 'Test script should be found')
  t.is(testScript?.longRunning, true, 'longRunning property should be preserved as true')
  t.is(testScript?.name, testScriptName, 'Script name should match')
  
  // Clean up
  await remove(filePath)
})

ava('getProcessedScripts handles longRunning: false correctly', async (t) => {
  const testScriptName = 'Test Short Script'
  const fileName = slugify(testScriptName, { lower: true })

  const scriptContent = `
// Name: ${testScriptName}
// Description: A test script with longRunning set to false
// longRunning: false

console.log("This is a quick script")
`

  // Ensure scripts directory exists
  await ensureDir(kenvPath('scripts'))
  
  // Create test script in the scripts directory
  const filePath = join(kenvPath('scripts'), `${fileName}.ts`)
  await outputFile(filePath, scriptContent)

  // Force cache refresh to include our new script
  const scripts = await getProcessedScripts(false) as Script[]

  // Find our test script
  const testScript = scripts.find(s => s.filePath === filePath)

  // Verify the script was found and has longRunning property set to false
  t.truthy(testScript, 'Test script should be found')
  t.is(testScript?.longRunning, false, 'longRunning property should be preserved as false')
  
  // Clean up
  await remove(filePath)
})

ava('getProcessedScripts handles missing longRunning property', async (t) => {
  const testScriptName = 'Test Default Script'
  const fileName = slugify(testScriptName, { lower: true })

  const scriptContent = `
// Name: ${testScriptName}
// Description: A test script without longRunning property

console.log("This is a normal script")
`

  // Ensure scripts directory exists
  await ensureDir(kenvPath('scripts'))
  
  // Create test script in the scripts directory
  const filePath = join(kenvPath('scripts'), `${fileName}.ts`)
  await outputFile(filePath, scriptContent)

  // Force cache refresh to include our new script
  const scripts = await getProcessedScripts(false) as Script[]

  // Find our test script
  const testScript = scripts.find(s => s.filePath === filePath)

  // Verify the script was found and longRunning is undefined
  t.truthy(testScript, 'Test script should be found')
  t.is(testScript?.longRunning, undefined, 'longRunning property should be undefined when not specified')
  
  // Clean up
  await remove(filePath)
})

ava('getProcessedScripts preserves longRunning through the entire pipeline', async (t) => {
  const testScriptName = 'Test Pipeline Script'
  const fileName = slugify(testScriptName, { lower: true })

  const scriptContent = `
// Name: ${testScriptName}
// Description: Test the full pipeline preservation
// longRunning: true
// Background: true

console.log("Testing full pipeline")
`

  // Ensure scripts directory exists
  await ensureDir(kenvPath('scripts'))
  
  // Create test script in the scripts directory
  const filePath = join(kenvPath('scripts'), `${fileName}.ts`)
  await outputFile(filePath, scriptContent)

  // Force cache refresh
  const scripts = await getProcessedScripts(false) as Script[]

  // Find our test script
  const testScript = scripts.find(s => s.filePath === filePath)

  // Verify all properties are preserved
  t.truthy(testScript, 'Test script should be found')
  t.is(testScript?.longRunning, true, 'longRunning should be preserved')
  t.is(testScript?.background, true, 'background should be preserved')
  t.is(testScript?.name, testScriptName, 'name should match')

  // Verify the script object has the expected shape
  t.truthy(testScript?.filePath, 'Should have filePath')
  t.truthy(testScript?.command, 'Should have command')
  
  // Clean up
  await remove(filePath)
})