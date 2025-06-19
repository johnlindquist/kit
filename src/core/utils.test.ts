import ava from 'ava'
import {
  parseScript,
  parseMarkdownAsScriptlets,
  shortcutNormalizer,
  getKenvFromPath,
  home,
  kenvPath,
  processPlatformSpecificTheme,
  parseSnippets,
  parseScriptletsFromPath,
  scriptsSort,
  templatePlaceholdersRegex
} from './utils'
import { outputTmpFile } from '../api/kit'
import { ensureDir } from '../globals/fs-extra'
import { cmd } from './constants'
import slugify from 'slugify'
import type { Stamp } from './db'
import type { CronExpression, Script, Snippet } from '../types'
import path from 'path'

// Helper function to create a temporary snippet file
process.env.KENV = home('.mock-kenv')
async function createTempSnippet(fileName: string, content: string) {
  const snippetDir = kenvPath('snippets')
  await ensureDir(snippetDir)
  return await outputTmpFile(path.join(snippetDir, fileName), content)
}

/**
 * [IMPORTANT]
 * These test create files in the tmp directory.
 * They each need unique names or tests will fail
 */

ava('parseScript name comment metadata', async (t) => {
  let name = 'Testing Parse Script Comment'
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

// Name: ${name}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.filePath, scriptPath)
})

ava('parseScript comment full metadata', async (t) => {
  let name = 'Testing Parse Script Comment Full Metadata'
  let description = 'This is a test description'
  let schedule = '0 0 * * *'
  let shortcut = `${cmd}+9`
  let normalizedShortcut = shortcutNormalizer(shortcut)
  let timeout = 15000
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

// Name: ${name}
// Description: ${description}
// Schedule: ${schedule}
// Shortcut: ${shortcut}
// Timeout: ${timeout}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.description, description)
  t.is(script.schedule, schedule as CronExpression)
  t.is(script.filePath, scriptPath)
  t.is(script.shortcut, normalizedShortcut)
  t.is(script.timeout, timeout)
})

ava('parseScript multiline description in global metadata', async (t) => {
  let name = 'Testing Multiline Description Global'
  let description = `This is a multiline description
that spans multiple lines
and should be properly parsed`
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

metadata = {
  name: "${name}",
  description: \`${description}\`
}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.description, description)
})

ava('parseScript multiline description in export metadata', async (t) => {
  let name = 'Testing Multiline Description Export'
  let description = `This is a multiline description
that spans multiple lines
and should be properly parsed`
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

export const metadata = {
  name: "${name}",
  description: \`${description}\`
}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.description, description)
})

ava('parseScript export convention metadata name', async (t) => {
  let name = 'Testing Parse Script Convention'
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

export const metadata = {
  name: "${name}"
}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.filePath, scriptPath)
})

ava('parseScript timeout metadata from comments', async (t) => {
  let name = 'Testing Timeout Metadata'
  let timeout = 5000
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

// Name: ${name}
// Timeout: ${timeout}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.timeout, timeout)
  t.is(script.filePath, scriptPath)
})

ava('parseScript timeout metadata from export', async (t) => {
  let name = 'Testing Timeout Export Metadata'
  let timeout = 10000
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

export const metadata = {
  name: "${name}",
  timeout: ${timeout}
}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.timeout, timeout)
  t.is(script.filePath, scriptPath)
})

ava('parseScript timeout metadata from global', async (t) => {
  let name = 'Testing Timeout Global Metadata'
  let timeout = 30000
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

metadata = {
  name: "${name}",
  timeout: ${timeout}
}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.timeout, timeout)
  t.is(script.filePath, scriptPath)
})

ava('parseScript global convention metadata name', async (t) => {
  let name = 'Testing Parse Script Convention Global'
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

metadata = {
  name: "${name}"
}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.filePath, scriptPath)
})

ava('parseScript ignore metadata variable name', async (t) => {
  let name = 'Testing Parse Script Convention Ignore Metadata Variable Name'
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

const metadata = {
  name: "${name}"
}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  // Don't pick up on the metadata variable name, so it's the slugified version
  t.is(script.name, fileName)
  t.is(script.filePath, scriptPath)
})

ava('parseMarkdownAsScripts', async (t) => {
  let markdown = `
## Open Script Kit
<!-- 
Trigger: sk
Alias:
Enabled: Yes
  -->

\`\`\`bash
open -a 'Google Chrome' https://scriptkit.com/{{user}}
\`\`\`

This Script Opens the Script Kit URL

I hope you enjoy!

## Append Note

\`\`\`kit
await appendFile(home("{{File Name}}.txt"), {{Note}})
\`\`\`
`

  const scripts = await parseMarkdownAsScriptlets(markdown)
  t.log(scripts)
  // t.is(scripts.length, 2)
  t.is(scripts[0].name, 'Open Script Kit')
  t.is(scripts[0].trigger, 'sk')
  t.is(scripts[0].tool, 'bash')
  t.is(scripts[0].scriptlet, "open -a 'Google Chrome' https://scriptkit.com/{{user}}")
  t.is(scripts[0].group, 'Scriptlets')
  t.deepEqual(scripts[0].inputs, ['user'])

  t.is(scripts[1].name, 'Append Note')
  t.is(scripts[1].tool, 'kit')
  t.is(scripts[1].scriptlet, 'await appendFile(home("{{File Name}}.txt"), {{Note}})')
  t.is(scripts[1].group, 'Scriptlets')
  t.deepEqual(scripts[1].inputs, ['File Name', 'Note'])
})

ava('parseMarkdownAsScripts handles quotes in name and formats command', async (t) => {
  let markdown = `
## What's This?
<!-- 
Trigger: test-quotes
Alias:
Enabled: Yes
  -->

\`\`\`bash
echo "This is a test script"
\`\`\`
`

  const scripts = await parseMarkdownAsScriptlets(markdown)
  t.is(scripts.length, 1)
  t.is(scripts[0].name, "What's This?")
  t.is(scripts[0].trigger, 'test-quotes')
  t.is(scripts[0].tool, 'bash')
  t.is(scripts[0].scriptlet, 'echo "This is a test script"')
  t.is(scripts[0].command, 'whats-this')
})

ava('parseMarkdownAsScripts allow JavaScript objects', async (t) => {
  let markdown = `
## Open Script Kit
<!-- 
Trigger: sk
Alias:
Enabled: Yes
  -->

\`\`\`bash
open -a 'Google Chrome' https://scriptkit.com/{{user}}
\`\`\`

This Script Opens the Script Kit URL

I hope you enjoy!

## Append Note

\`\`\`kit
await appendFile(home("{{File Name}}.txt"), {{Note}})
\`\`\`
`

  const scripts = await parseMarkdownAsScriptlets(markdown)
  // t.log(scripts)
  // t.is(scripts.length, 2)
  t.is(scripts[0].name, 'Open Script Kit')
  t.is(scripts[0].trigger, 'sk')
  t.is(scripts[0].tool, 'bash')
  t.is(scripts[0].scriptlet, "open -a 'Google Chrome' https://scriptkit.com/{{user}}")
  t.is(scripts[0].group, 'Scriptlets')
  t.deepEqual(scripts[0].inputs, ['user'])

  t.is(scripts[1].name, 'Append Note')
  t.is(scripts[1].tool, 'kit')
  t.is(scripts[1].scriptlet, 'await appendFile(home("{{File Name}}.txt"), {{Note}})')
  t.is(scripts[1].group, 'Scriptlets')
  t.deepEqual(scripts[1].inputs, ['File Name', 'Note'])
})

ava('parseMarkdownAsScripts allow JavaScript imports, exports, ${', async (t) => {
  let markdown = `
## Open Script Kit
<!-- 
Trigger: sk
Alias:
Enabled: Yes
  -->

\`\`\`bash
open -a 'Google Chrome' https://scriptkit.com/{{user}}
\`\`\`

This Script Opens the Script Kit URL

I hope you enjoy!

## Append Note

<!-- 
Shortcut: cmd o
cwd: ~/Downloads
prepend: PATH=/usr/local/bin
append: | grep "foo"
-->

\`\`\`kit
import { appendFile } from "fs"
let note = "This is a note"
await exec(\`echo "\${note}" >> foo.txt\`)
await appendFile(home("{{File Name}}.txt"), {{Note}})
export { note }
\`\`\`
`

  const scripts = await parseMarkdownAsScriptlets(markdown)
  // t.log(scripts)
  // t.is(scripts.length, 2)
  t.is(scripts[0].name, 'Open Script Kit')
  t.is(scripts[0].trigger, 'sk')
  t.is(scripts[0].tool, 'bash')
  t.is(scripts[0].tag, 'trigger: sk')
  t.is(scripts[0].scriptlet, "open -a 'Google Chrome' https://scriptkit.com/{{user}}")
  t.is(scripts[0].group, 'Scriptlets')
  t.deepEqual(scripts[0].inputs, ['user'])

  t.is(scripts[1].name, 'Append Note')
  t.is(scripts[1].tool, 'kit')
  t.is(scripts[1].cwd, '~/Downloads')
  t.is(scripts[1].prepend, 'PATH=/usr/local/bin')
  t.is(scripts[1].append, '| grep "foo"')
  if (process.platform === 'darwin') {
    t.is(scripts[1].tag, 'cmd+o')
  } else {
    t.is(scripts[1].tag, 'ctrl+o')
  }
  t.is(
    scripts[1].scriptlet,
    `
import { appendFile } from "fs"
let note = "This is a note"
await exec(\`echo "\${note}" >> foo.txt\`)
await appendFile(home("{{File Name}}.txt"), {{Note}})
export { note }
		`.trim()
  )
  t.is(scripts[1].group, 'Scriptlets')
  t.deepEqual(scripts[1].inputs, ['File Name', 'Note'])
})

ava("parseMarkdownAsScripts allow doesn't create multiple inputs for the same template variable", async (t) => {
  let markdown = `
## Open Script Kit
<!-- 
Trigger: sk
Alias:
Enabled: Yes
  -->

\`\`\`bash
open -a 'Google Chrome' https://scriptkit.com/{{user}} && echo "{{user}}"
\`\`\`

This Script Opens the Script Kit URL

I hope you enjoy!

## Append Note

<!-- 
Shortcut: cmd o
cwd: ~/Downloads
prepend: PATH=/usr/local/bin
append: | grep "foo"
-->

\`\`\`kit
import { appendFile } from "fs"
let note = "This is a note"
await exec(\`echo "\${note}" >> foo.txt\`)
await appendFile(home("{{File Name}}.txt"), {{Note}})
console.log("Creating {{Note}}")
export { note }
\`\`\`
`

  const scripts = await parseMarkdownAsScriptlets(markdown)

  t.deepEqual(scripts[0].inputs, ['user'])
  t.deepEqual(scripts[1].inputs, ['File Name', 'Note'])
})

ava('parseScriptlets tool default to bash or cmd', async (t) => {
  let scriptlet = await parseMarkdownAsScriptlets(`
## Append Note

<!-- 
Shortcut: cmd o
cwd: ~/Downloads
-->

\`\`\`
echo "hello world"
\`\`\`		
		
		`)
  t.is(scriptlet[0].tool, process.platform === 'win32' ? 'cmd' : 'bash')
})

ava("parseMarkdownAsScriptlets doesn't error on empty string", async (t) => {
  let scriptlets = await parseMarkdownAsScriptlets('')
  t.is(scriptlets.length, 0)
})

ava('parseScriptletsFromPath - valid markdown file', async (t) => {
  const markdown = `
# Test

## Test Scriptlet
<!-- 
Shortcut: cmd t
-->

\`\`\`js
console.log("Hello, world!")
\`\`\`
`
  const filePath = await outputTmpFile('test-scriptlet.md', markdown)
  const scripts = await parseScriptletsFromPath(filePath)

  // t.log(scripts[0])
  t.is(scripts.length, 1)
  t.is(scripts[0].name, 'Test Scriptlet')
  if (process.platform === 'darwin') {
    t.is(scripts[0].friendlyShortcut, 'cmd+t')
  } else {
    t.is(scripts[0].friendlyShortcut, 'ctrl+t')
  }
  t.is(scripts[0].scriptlet.trim(), 'console.log("Hello, world!")')
  t.is(scripts[0].group, 'Test')
  t.is(scripts[0].filePath, `${filePath}#Test-Scriptlet`)
  t.is(scripts[0].kenv, '')
})

ava('parseScriptletsFromPath - empty file', async (t) => {
  const filePath = await outputTmpFile('empty-scriptlet.md', '')
  const scripts = await parseScriptletsFromPath(filePath)

  t.is(scripts.length, 0)
})

ava('parseScriptletsFromPath  me- file with multiple scriptlets', async (t) => {
  const markdown = `
## Scriptlet 1
\`\`\`js
console.log("Scriptlet 1")
\`\`\`

## Scriptlet 2
\`\`\`js
console.log("Scriptlet 2")
\`\`\`
`
  const filePath = await outputTmpFile('multiple-scriptlets.md', markdown)
  const scripts = await parseScriptletsFromPath(filePath)

  t.is(scripts.length, 2)
  t.is(scripts[0].name, 'Scriptlet 1')
  t.is(scripts[1].name, 'Scriptlet 2')
})

ava('parseScriptletsFromPath - h1 as group', async (t) => {
  const markdown = `
# Group A
## Scriptlet 1
\`\`\`js
console.log("Scriptlet 1")
\`\`\`

## Scriptlet 2
\`\`\`js
console.log("Scriptlet 2")
\`\`\`
\`\`\`
`
  const filePath = await outputTmpFile('grouped-scriptlets.md', markdown)
  const scripts = await parseScriptletsFromPath(filePath)

  t.is(scripts.length, 2)
  t.is(scripts[0].name, 'Scriptlet 1')
  t.is(scripts[0].group, 'Group A')
  t.is(scripts[1].name, 'Scriptlet 2')
  t.is(scripts[1].group, 'Group A')
})

ava('getKenvFromPath - main kenv', async (t) => {
  let scriptletsPath = kenvPath('script', 'kit.md')
  let kenv = getKenvFromPath(scriptletsPath)
  t.is(kenv, '')
})

ava('getKenvFromPath - sub kenv', async (t) => {
  let scriptletsPath = kenvPath('kenvs', 'test', 'script', 'kit.md')
  let kenv = getKenvFromPath(scriptletsPath)
  t.is(kenv, 'test')
})

ava('getKenvFromPath - no kenv, empty string', async (t) => {
  let scriptletsPath = home('kit.md')
  t.is(getKenvFromPath(scriptletsPath), '')
})

ava('processPlatformSpecificTheme - Mac specific', (t) => {
  const originalPlatform = process.platform
  Object.defineProperty(process, 'platform', { value: 'darwin' })

  const input = `
    --color-primary-mac: #ff0000;
    --color-secondary-win: #00ff00;
    --color-tertiary-other: #0000ff;
    --color-neutral: #cccccc;
  `

  const expected = `
    --color-primary: #ff0000;
    --color-neutral: #cccccc;
  `

  const result = processPlatformSpecificTheme(input)
  t.is(result.trim(), expected.trim())

  Object.defineProperty(process, 'platform', { value: originalPlatform })
})

ava('processPlatformSpecificTheme - Windows specific', (t) => {
  const originalPlatform = process.platform
  Object.defineProperty(process, 'platform', { value: 'win32' })

  const input = `
    --color-primary-mac: #ff0000;
    --color-secondary-win: #00ff00;
    --color-tertiary-other: #0000ff;
    --color-neutral: #cccccc;
  `

  const expected = `
    --color-secondary: #00ff00;
    --color-neutral: #cccccc;
  `

  const result = processPlatformSpecificTheme(input)
  t.is(result.trim(), expected.trim())

  Object.defineProperty(process, 'platform', { value: originalPlatform })
})

ava('processPlatformSpecificTheme - Other platform', (t) => {
  const originalPlatform = process.platform
  Object.defineProperty(process, 'platform', { value: 'linux' })

  const input = `
    --color-primary-mac: #ff0000;
    --color-secondary-win: #00ff00;
    --color-tertiary-other: #0000ff;
    --color-neutral: #cccccc;
  `

  const expected = `
    --color-tertiary: #0000ff;
    --color-neutral: #cccccc;
  `

  const result = processPlatformSpecificTheme(input)
  t.is(result.trim(), expected.trim())

  Object.defineProperty(process, 'platform', { value: originalPlatform })
})

ava('processPlatformSpecificTheme - No platform-specific variables', (t) => {
  const input = `
    --color-primary: #ff0000;
    --color-secondary: #00ff00;
    --color-tertiary: #0000ff;
    --color-neutral: #cccccc;
  `

  const result = processPlatformSpecificTheme(input)
  t.is(result.trim(), input.trim())
})

ava('processPlatformSpecificTheme - Empty input', (t) => {
  const input = ''
  const result = processPlatformSpecificTheme(input)
  t.is(result, '')
})

// TODO: Figure out process.env.KENV = on windows
if (process.platform !== 'win32') {
  ava('parseSnippets - basic snippet', async (t) => {
    const content = `
// Name: Test Snippet
// Snippet: test
console.log("Hello, world!");
  `.trim()

    await createTempSnippet('test-snippet.txt', content)

    const snippets = await parseSnippets()
    const testSnippet = snippets.find((s) => s.name === 'Test Snippet')

    t.truthy(testSnippet)
    if (testSnippet) {
      t.is(testSnippet.name, 'Test Snippet')
      t.is(testSnippet.tag, 'test')
      t.is(testSnippet.text.trim(), 'console.log("Hello, world!");')
      t.is(testSnippet.group, 'Snippets')
      t.is(testSnippet.kenv, '')
      t.is(testSnippet.expand, 'test')
    }
  })

  ava('parseSnippets - snippet without metadata', async (t) => {
    const content = `console.log("No metadata");`
    const fileName = 'no-metadata-snippet.txt'
    const filePath = await createTempSnippet(fileName, content)

    const snippets = await parseSnippets()
    const testSnippet = snippets.find((s) => s.filePath === filePath)

    t.truthy(testSnippet)
    if (testSnippet) {
      t.is(testSnippet.name, path.basename(filePath))
      t.is(testSnippet.tag, '')
      t.is(testSnippet.expand, '')
      t.is(testSnippet.text.trim(), content)
    }
  })

  ava('parseSnippets - snippet with HTML content', async (t) => {
    const content = `
// Name: HTML Snippet
<div>
  <h1>Hello, world!</h1>
</div>
  `.trim()

    await createTempSnippet('html-snippet.txt', content)

    const snippets = await parseSnippets()
    const testSnippet = snippets.find((s) => s.name === 'HTML Snippet')

    t.truthy(testSnippet)
    if (testSnippet) {
      t.is(testSnippet.name, 'HTML Snippet')
      t.is(testSnippet.text.trim(), '<div>\n  <h1>Hello, world!</h1>\n</div>')
      const expectedPreview = `<div class="p-4">\n  <style>\n  p{\n    margin-bottom: 1rem;\n  }\n  li{\n    margin-bottom: .25rem;\n  }\n  \n  </style>\n  <div>\n  <h1>Hello, world!</h1>\n</div>\n</div>`.trim()
      if (testSnippet.preview && typeof testSnippet.preview === 'string') {
        t.is(testSnippet.preview.replace(/\r\n/g, '\n').trim(), expectedPreview)
      }
    }
  })

  ava('parseSnippets - multiple snippets', async (t) => {
    const snippet1 = `
// Name: Snippet 1
// Snippet: s1
console.log("Snippet 1");
  `.trim()

    const snippet2 = `
// Name: Snippet 2
// Snippet: s2
console.log("Snippet 2");
  `.trim()

    await createTempSnippet('snippet1.txt', snippet1)
    await createTempSnippet('snippet2.txt', snippet2)

    const snippets = await parseSnippets()
    const testSnippet1 = snippets.find((s) => s.name === 'Snippet 1')
    const testSnippet2 = snippets.find((s) => s.name === 'Snippet 2')

    t.truthy(testSnippet1)
    t.truthy(testSnippet2)

    // Sorted by name by default
    const definedSnippets = [testSnippet1, testSnippet2].filter(Boolean) as Snippet[]
    const testSnippets = definedSnippets.sort((a, b) => a.name.localeCompare(b.name))

    t.is(testSnippets.length, 2)
    if (testSnippets[0] && testSnippets[1]) {
      t.is(testSnippets[0].tag, 's1')
      t.is(testSnippets[1].tag, 's2')
      t.is(testSnippets[0].value, 'console.log("Snippet 1");')
      t.is(testSnippets[1].value, 'console.log("Snippet 2");')
    }
  })
}

// Clean up temporary files after all tests
// ava.after.always(async () => {
// 	const snippetDir = path.join(kenvPath(), "snippets")
// 	await rmdir(snippetDir, { recursive: true })
// })

if (process.platform !== 'win32') {
  ava('parseScriptlets no tool preview uses bash codeblock', async (t) => {
    let scriptlet = await parseMarkdownAsScriptlets(`
## Append Note

<!-- 
Shortcut: cmd o
cwd: ~/Downloads
-->

\`\`\`
echo "hello world"
\`\`\`		
		
		`)

    t.log(scriptlet[0].preview)

    t.true((scriptlet[0].preview as string)?.includes('language-bash'))
  })

  ava('parseScriptlets with tool preview uses tool codeblock', async (t) => {
    let scriptlet = await parseMarkdownAsScriptlets(`
	## Append Note
	
	<!-- 
	Shortcut: cmd o
	cwd: ~/Downloads
	-->
	
	\`\`\`python
	echo "hello world"
	\`\`\`		
			
			`)

    t.log(scriptlet[0].preview)

    t.true((scriptlet[0].preview as string)?.includes('language-python'))
  })
}

ava('parseScriptlets with a shell tool and without inputs uses shebang', async (t) => {
  let scriptlet = await parseMarkdownAsScriptlets(`
## Append Note

<!-- 
Shortcut: cmd o
cwd: ~/Downloads
-->

\`\`\`
echo "hello world"
\`\`\`		
		
		`)

  // t.log(scriptlet[0])

  t.truthy(scriptlet[0].shebang)
})

ava("parseScriptlets with a shell tool with inputs doesn't use shebang", async (t) => {
  let scriptlet = await parseMarkdownAsScriptlets(`
## Append Note

<!-- 
Shortcut: cmd o
cwd: ~/Downloads
-->

\`\`\`
echo "hello {{who}}"
\`\`\`		
		
		`)

  // t.log(scriptlet[0])

  t.falsy(scriptlet[0].shebang)
})

ava('scriptsSort - sorts by index when timestamps are equal', (t) => {
  const timestamps: Stamp[] = []
  const scripts = [
    { index: 2, name: 'B', filePath: 'b.ts' },
    { index: 1, name: 'A', filePath: 'a.ts' },
    { index: 3, name: 'C', filePath: 'c.ts' }
  ] as Script[]

  const sortedScripts = [...scripts].sort(scriptsSort(timestamps))

  t.is(sortedScripts[0].name, 'A')
  t.is(sortedScripts[1].name, 'B')
  t.is(sortedScripts[2].name, 'C')
})

ava('scriptsSort - treats missing index as 9999', (t) => {
  const timestamps: Stamp[] = []
  const scripts = [
    { name: 'No Index', filePath: 'no-index.ts' },
    { index: 1, name: 'Has Index', filePath: 'has-index.ts' }
  ] as Script[]

  const sortedScripts = [...scripts].sort(scriptsSort(timestamps))

  t.is(sortedScripts[0].name, 'Has Index')
  t.is(sortedScripts[1].name, 'No Index')
})

ava('scriptsSort - timestamps take precedence over index', (t) => {
  const now = Date.now()
  const timestamps: Stamp[] = [
    { filePath: 'b.ts', timestamp: now },
    { filePath: 'a.ts', timestamp: now - 1000 }
  ]

  const scripts = [
    { index: 2, name: 'B', filePath: 'b.ts' },
    { index: 1, name: 'A', filePath: 'a.ts' }
  ] as Script[]

  const sortedScripts = [...scripts].sort(scriptsSort(timestamps))

  t.is(sortedScripts[0].name, 'B', 'More recent timestamp should come first')
  t.is(sortedScripts[1].name, 'A')
})

ava('scriptsSort - falls back to name when no timestamps or index', (t) => {
  const timestamps: Stamp[] = []
  const scripts = [
    { name: 'Charlie', filePath: 'c.ts' },
    { name: 'Alpha', filePath: 'a.ts' },
    { name: 'Bravo', filePath: 'b.ts' }
  ] as Script[]

  const sortedScripts = [...scripts].sort(scriptsSort(timestamps))

  t.is(sortedScripts[0].name, 'Alpha')
  t.is(sortedScripts[1].name, 'Bravo')
  t.is(sortedScripts[2].name, 'Charlie')
})

ava('templatePlaceholdersRegex - detects VS Code snippet variables', (t) => {
  // Valid patterns
  t.true(templatePlaceholdersRegex.test('${1:default}'))
  t.true(templatePlaceholdersRegex.test('${foo|bar}'))
  t.true(templatePlaceholdersRegex.test('${name}'))
  t.true(templatePlaceholdersRegex.test('$1'))
  t.true(templatePlaceholdersRegex.test('${1}'))
  t.true(templatePlaceholdersRegex.test('${foo|bar|baz}')) // Multiple choices
  t.true(templatePlaceholdersRegex.test('${1:foo bar}')) // Spaces in default
  t.true(templatePlaceholdersRegex.test('${foo-bar}')) // Dashes in names
  t.true(templatePlaceholdersRegex.test('${1:foo:bar}')) // Colons in default value

  // Invalid patterns
  t.false(templatePlaceholdersRegex.test('$'))
  t.false(templatePlaceholdersRegex.test('${'))
  t.false(templatePlaceholdersRegex.test('${}'))
  t.false(templatePlaceholdersRegex.test('${|}'))
  t.false(templatePlaceholdersRegex.test('$foo'))
  t.false(templatePlaceholdersRegex.test('${nested{}}'))
  t.false(templatePlaceholdersRegex.test('${foo|}')) // Empty last choice
  t.false(templatePlaceholdersRegex.test('${|foo}')) // Empty first choice
  t.false(templatePlaceholdersRegex.test('${foo||bar}')) // Double pipe
  t.false(templatePlaceholdersRegex.test('${foo|bar|}')) // Trailing pipe
})
