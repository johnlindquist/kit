import test from "ava"
import {
  parseScript,
  parseMarkdownAsScriptlets,
  shortcutNormalizer,
  getKenvFromPath,
  home,
  kenvPath,
} from "./utils"
import { outputTmpFile } from "../api/kit"
import slugify from "slugify"

/**
 * [IMPORTANT]
 * These test create files in the tmp directory.
 * They each need unique names or tests will fail
 */

test("parseScript name comment metadata", async t => {
  let name = "Testing Parse Script Comment"
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

// Name: ${name}
  `.trim()

  let scriptPath = await outputTmpFile(
    `${fileName}.ts`,
    scriptContent
  )

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.filePath, scriptPath)
})

test("parseScript comment full metadata", async t => {
  let name = "Testing Parse Script Comment Full Metadata"
  let description = "This is a test description"
  let schedule = "0 0 * * *"
  let shortcut = `${cmd}+9`
  let normalizedShortcut = shortcutNormalizer(shortcut)
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

// Name: ${name}
// Description: ${description}
// Schedule: ${schedule}
// Shortcut: ${shortcut}
  `.trim()

  let scriptPath = await outputTmpFile(
    `${fileName}.ts`,
    scriptContent
  )

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.description, description)
  t.is(script.schedule, schedule)
  t.is(script.filePath, scriptPath)
  t.is(script.shortcut, normalizedShortcut)
})

test("parseScript export convention metadata name", async t => {
  let name = "Testing Parse Script Convention"
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

export const metadata = {
  name: "${name}"
}
  `.trim()

  let scriptPath = await outputTmpFile(
    `${fileName}.ts`,
    scriptContent
  )

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.filePath, scriptPath)
})

test("parseScript global convention metadata name", async t => {
  let name = "Testing Parse Script Convention Global"
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

metadata = {
  name: "${name}"
}
  `.trim()

  let scriptPath = await outputTmpFile(
    `${fileName}.ts`,
    scriptContent
  )

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.filePath, scriptPath)
})

test("parseScript ignore metadata variable name", async t => {
  let name =
    "Testing Parse Script Convention Ignore Metadata Variable Name"
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

const metadata = {
  name: "${name}"
}
  `.trim()

  let scriptPath = await outputTmpFile(
    `${fileName}.ts`,
    scriptContent
  )

  let script = await parseScript(scriptPath)
  // Don't pick up on the metadata variable name, so it's the slugified version
  t.is(script.name, fileName)
  t.is(script.filePath, scriptPath)
})

test("parseMarkdownAsScripts", async t => {
  let markdown = `
## Open Script Kit
<!-- 
Trigger: sk
Alias:
Enabled: Yes
  -->

\`\`\`bash
open -a 'Google Chrome' https://scriptkit.com/{user}
\`\`\`

This Script Opens the Script Kit URL

I hope you enjoy!

## Append Note

\`\`\`kit
await appendFile(home("{File Name}.txt"), {Note})
\`\`\`
`

  const scripts = await parseMarkdownAsScriptlets(markdown)
  t.log(scripts)
  // t.is(scripts.length, 2)
  t.is(scripts[0].name, "Open Script Kit")
  t.is(scripts[0].trigger, "sk")
  t.is(scripts[0].tool, "bash")
  t.is(
    scripts[0].scriptlet,
    "open -a 'Google Chrome' https://scriptkit.com/{user}"
  )
  t.is(scripts[0].group, "Scriptlets")
  t.deepEqual(scripts[0].inputs, ["user"])

  t.is(scripts[1].name, "Append Note")
  t.is(scripts[1].tool, "kit")
  t.is(
    scripts[1].scriptlet,
    'await appendFile(home("{File Name}.txt"), {Note})'
  )
  t.is(scripts[1].group, "Scriptlets")
  t.deepEqual(scripts[1].inputs, ["File Name", "Note"])
})

test("parseMarkdownAsScripts allow JavaScript objects", async t => {
  let markdown = `
## Open Script Kit
<!-- 
Trigger: sk
Alias:
Enabled: Yes
  -->

\`\`\`bash
open -a 'Google Chrome' https://scriptkit.com/{user}
\`\`\`

This Script Opens the Script Kit URL

I hope you enjoy!

## Append Note

\`\`\`kit
await appendFile(home("{File Name}.txt"), {Note})
\`\`\`
`

  const scripts = await parseMarkdownAsScriptlets(markdown)
  t.log(scripts)
  // t.is(scripts.length, 2)
  t.is(scripts[0].name, "Open Script Kit")
  t.is(scripts[0].trigger, "sk")
  t.is(scripts[0].tool, "bash")
  t.is(
    scripts[0].scriptlet,
    "open -a 'Google Chrome' https://scriptkit.com/{user}"
  )
  t.is(scripts[0].group, "Scriptlets")
  t.deepEqual(scripts[0].inputs, ["user"])

  t.is(scripts[1].name, "Append Note")
  t.is(scripts[1].tool, "kit")
  t.is(
    scripts[1].scriptlet,
    'await appendFile(home("{File Name}.txt"), {Note})'
  )
  t.is(scripts[1].group, "Scriptlets")
  t.deepEqual(scripts[1].inputs, ["File Name", "Note"])
})

test("parseScriptlets doesn't error on empty string", async t => {
  let scriptlets = await parseMarkdownAsScriptlets("")
  t.is(scriptlets.length, 0)
})


test("getKenvFromPath - main kenv", async t => {
  let scriptletsPath = kenvPath("script", "kit.md")
  let kenv = getKenvFromPath(scriptletsPath)
  t.is(kenv, "")
})

test("getKenvFromPath - sub kenv", async t => {
  let scriptletsPath = kenvPath("kenvs", "test", "script", "kit.md")
  let kenv = getKenvFromPath(scriptletsPath)
  t.is(kenv, "test")
})

test("getKenvFromPath - no kenv, throw", async t => {
  let scriptletsPath = home("kit.md")
  t.throws(() => getKenvFromPath(scriptletsPath))
})