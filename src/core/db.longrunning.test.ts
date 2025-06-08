import ava from 'ava'
import slugify from 'slugify'
import { outputTmpFile } from '../api/kit.js'
import { getScriptsDb, getScripts } from './db.js'

ava('scripts database preserves longRunning property', async (t) => {
  const testScriptName = 'DB Test Longrunning Script'
  const fileName = slugify(testScriptName, { lower: true })

  const scriptContent = `
// Name: ${testScriptName}
// Description: Testing database persistence of longRunning
// Longrunning: true

console.log("DB test script")
`

  // Create temporary test script
  const filePath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  // Force database refresh
  const scriptsDb = await getScriptsDb(false)

  // Find our test script in the database
  const testScript = scriptsDb.scripts.find(s => s.filePath === filePath)

  // Verify the script has longRunning property in database
  t.truthy(testScript, 'Test script should be in database')
  t.is(testScript?.longRunning, true, 'longRunning property should be preserved in database')

  // Write to database and read back
  await scriptsDb.write()

  // Get scripts again from cache to verify persistence
  const cachedScripts = await getScripts(true)
  const cachedScript = cachedScripts.find(s => s.filePath === filePath)

  t.truthy(cachedScript, 'Script should be retrievable from cache')
  t.is(cachedScript?.longRunning, true, 'longRunning property should persist through cache')
})

ava('scripts database handles various longRunning values', async (t) => {
  const testCases = [
    { value: 'true', expected: true },
    { value: 'false', expected: false }
  ]

  for (const testCase of testCases) {
    const testScriptName = `DB Test Longrunning ${testCase.value}`
    const fileName = slugify(testScriptName, { lower: true })

    const scriptContent = `
// Name: ${testScriptName}
// Description: Testing ${testCase.value} value
// Longrunning: ${testCase.value}

console.log("Test")
`

    const filePath = await outputTmpFile(`${fileName}.ts`, scriptContent)

    // Force database refresh
    const scriptsDb = await getScriptsDb(false)
    const testScript = scriptsDb.scripts.find(s => s.filePath === filePath)

    t.is(testScript?.longRunning, testCase.expected,
      `longRunning: ${testCase.value} should be stored as ${testCase.expected}`)
  }
})

ava('scripts database preserves all metadata including longRunning', async (t) => {
  const testScriptName = 'DB Test All Metadata'
  const fileName = slugify(testScriptName, { lower: true })

  const scriptContent = `
// Name: ${testScriptName}
// Description: Test all metadata preservation
// Longrunning: true
// Background: true
// Schedule: */5 * * * *
// Shortcut: cmd+shift+t

console.log("All metadata test")
`

  const filePath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  // Force database refresh and get the database instance
  const scriptsDb = await getScriptsDb(false)

  // Find our test script
  const testScript = scriptsDb.scripts.find(s => s.filePath === filePath)

  // Verify all metadata is preserved
  t.truthy(testScript, 'Test script should be in database')
  t.is(testScript?.name, testScriptName, 'name should be preserved')
  t.is(testScript?.longRunning, true, 'longRunning should be preserved')
  t.is(testScript?.background, true, 'background should be preserved')
  t.is(testScript?.schedule, '*/5 * * * *', 'schedule should be preserved')
  t.truthy(testScript?.shortcut, 'shortcut should be preserved')

  // Write and verify persistence
  await scriptsDb.write()

  // Create a new database instance to verify data persists
  const newScriptsDb = await getScriptsDb(true)
  const persistedScript = newScriptsDb.scripts.find(s => s.filePath === filePath)

  t.is(persistedScript?.longRunning, true, 'longRunning should persist after write')
  t.is(persistedScript?.background, true, 'background should persist after write')
})