import ava from 'ava'
import { generateScriptletMenuScript, generateScriptletMenuPreview } from './scriptlet-menu-template'

ava('generateScriptletMenuScript generates valid script with group name', (t) => {
  const groupName = 'My Scripts'
  const script = generateScriptletMenuScript(groupName)

  // Should contain the group filter
  t.true(script.includes(`s.group === "My Scripts"`))

  // Should contain key function definitions
  t.true(script.includes('isScriptlet'))
  t.true(script.includes('isSnippet'))
  t.true(script.includes('determineScriptletRun'))

  // Should import runScriptlet
  t.true(script.includes('runScriptlet'))

  // Should handle getScripts
  t.true(script.includes('getScripts(true)'))
})

ava('generateScriptletMenuScript escapes double quotes in group name', (t) => {
  const groupName = 'My "Special" Scripts'
  const script = generateScriptletMenuScript(groupName)

  // Should escape the double quotes
  t.true(script.includes(`s.group === "My \\"Special\\" Scripts"`))
})

ava('generateScriptletMenuPreview generates expected preview', (t) => {
  const groupName = 'Utilities'
  const preview = generateScriptletMenuPreview(groupName)

  t.is(preview, 'List all the scriptlets in the Utilities group')
})

ava('generateScriptletMenuScript handles special characters in group name', (t) => {
  const groupName = "Developer's Tools & Utils"
  const script = generateScriptletMenuScript(groupName)

  // Should handle the apostrophe and ampersand
  t.true(script.includes(`s.group === "Developer's Tools & Utils"`))
})
