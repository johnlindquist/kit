import ava from "ava"
import {
	parseScript,
	parseMarkdownAsScriptlets,
	shortcutNormalizer,
	getKenvFromPath,
	home,
	kenvPath,
	processPlatformSpecificTheme,
	parseSnippets
} from "./utils"
import { outputTmpFile } from "../api/kit"
import slugify from "slugify"

// Helper function to create a temporary snippet file
process.env.KENV = home(".mock-kenv")
async function createTempSnippet(fileName: string, content: string) {
	const snippetDir = kenvPath("snippets")
	await ensureDir(snippetDir)
	return await outputTmpFile(path.join(snippetDir, fileName), content)
}

/**
 * [IMPORTANT]
 * These test create files in the tmp directory.
 * They each need unique names or tests will fail
 */

ava("parseScript name comment metadata", async (t) => {
	let name = "Testing Parse Script Comment"
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

ava("parseScript comment full metadata", async (t) => {
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

	let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

	let script = await parseScript(scriptPath)
	t.is(script.name, name)
	t.is(script.description, description)
	t.is(script.schedule, schedule)
	t.is(script.filePath, scriptPath)
	t.is(script.shortcut, normalizedShortcut)
})

ava("parseScript export convention metadata name", async (t) => {
	let name = "Testing Parse Script Convention"
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

ava("parseScript global convention metadata name", async (t) => {
	let name = "Testing Parse Script Convention Global"
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

ava("parseScript ignore metadata variable name", async (t) => {
	let name = "Testing Parse Script Convention Ignore Metadata Variable Name"
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

ava("parseMarkdownAsScripts", async (t) => {
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
	// t.log(scripts)
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

ava("parseMarkdownAsScripts allow JavaScript objects", async (t) => {
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
	// t.log(scripts)
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

ava(
	"parseMarkdownAsScripts allow JavaScript imports, exports, ${",
	async (t) => {
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
await appendFile(home("{File Name}.txt"), {Note})
export { note }
\`\`\`
`

		const scripts = await parseMarkdownAsScriptlets(markdown)
		// t.log(scripts)
		// t.is(scripts.length, 2)
		t.is(scripts[0].name, "Open Script Kit")
		t.is(scripts[0].trigger, "sk")
		t.is(scripts[0].tool, "bash")
		t.is(scripts[0].tag, "trigger: sk")
		t.is(
			scripts[0].scriptlet,
			"open -a 'Google Chrome' https://scriptkit.com/{user}"
		)
		t.is(scripts[0].group, "Scriptlets")
		t.deepEqual(scripts[0].inputs, ["user"])

		t.is(scripts[1].name, "Append Note")
		t.is(scripts[1].tool, "kit")
		t.is(scripts[1].cwd, "~/Downloads")
		t.is(scripts[1].prepend, "PATH=/usr/local/bin")
		t.is(scripts[1].append, '| grep "foo"')
		if (process.platform === "darwin") {
			t.is(scripts[1].tag, "cmd+o")
		} else {
			t.is(scripts[1].tag, "ctrl+o")
		}
		t.is(
			scripts[1].scriptlet,
			`
import { appendFile } from "fs"
let note = "This is a note"
await exec(\`echo "\${note}" >> foo.txt\`)
await appendFile(home("{File Name}.txt"), {Note})
export { note }
		`.trim()
		)
		t.is(scripts[1].group, "Scriptlets")
		t.deepEqual(scripts[1].inputs, ["File Name", "Note"])
	}
)

ava(
	"parseMarkdownAsScripts allow doesn't create multiple inputs for the same template variable",
	async (t) => {
		let markdown = `
## Open Script Kit
<!-- 
Trigger: sk
Alias:
Enabled: Yes
  -->

\`\`\`bash
open -a 'Google Chrome' https://scriptkit.com/{user} && echo "{user}"
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
await appendFile(home("{File Name}.txt"), {Note})
console.log("Creating {Note}")
export { note }
\`\`\`
`

		const scripts = await parseMarkdownAsScriptlets(markdown)

		t.deepEqual(scripts[0].inputs, ["user"])
		t.deepEqual(scripts[1].inputs, ["File Name", "Note"])
	}
)

ava("parseScriptlets doesn't error on empty string", async (t) => {
	let scriptlets = await parseMarkdownAsScriptlets("")
	t.is(scriptlets.length, 0)
})

ava("getKenvFromPath - main kenv", async (t) => {
	let scriptletsPath = kenvPath("script", "kit.md")
	let kenv = getKenvFromPath(scriptletsPath)
	t.is(kenv, "")
})

ava("getKenvFromPath - sub kenv", async (t) => {
	let scriptletsPath = kenvPath("kenvs", "test", "script", "kit.md")
	let kenv = getKenvFromPath(scriptletsPath)
	t.is(kenv, "test")
})

ava("getKenvFromPath - no kenv, throw", async (t) => {
	let scriptletsPath = home("kit.md")
	t.throws(() => getKenvFromPath(scriptletsPath))
})

ava("processPlatformSpecificTheme - Mac specific", (t) => {
	const originalPlatform = process.platform
	Object.defineProperty(process, "platform", { value: "darwin" })

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

	Object.defineProperty(process, "platform", { value: originalPlatform })
})

ava("processPlatformSpecificTheme - Windows specific", (t) => {
	const originalPlatform = process.platform
	Object.defineProperty(process, "platform", { value: "win32" })

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

	Object.defineProperty(process, "platform", { value: originalPlatform })
})

ava("processPlatformSpecificTheme - Other platform", (t) => {
	const originalPlatform = process.platform
	Object.defineProperty(process, "platform", { value: "linux" })

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

	Object.defineProperty(process, "platform", { value: originalPlatform })
})

ava("processPlatformSpecificTheme - No platform-specific variables", (t) => {
	const input = `
    --color-primary: #ff0000;
    --color-secondary: #00ff00;
    --color-tertiary: #0000ff;
    --color-neutral: #cccccc;
  `

	const result = processPlatformSpecificTheme(input)
	t.is(result.trim(), input.trim())
})

ava("processPlatformSpecificTheme - Empty input", (t) => {
	const input = ""
	const result = processPlatformSpecificTheme(input)
	t.is(result, "")
})

ava("parseSnippets - basic snippet", async (t) => {
	const content = `
// Name: Test Snippet
// Snippet: test
console.log("Hello, world!");
  `.trim()

	await createTempSnippet("test-snippet.txt", content)

	const snippets = await parseSnippets()
	const testSnippet = snippets.find((s) => s.name === "Test Snippet")

	t.truthy(testSnippet)
	t.is(testSnippet.name, "Test Snippet")
	t.is(testSnippet.tag, "test")
	t.is(testSnippet.text.trim(), 'console.log("Hello, world!");')
	t.is(testSnippet.group, "Snippets")
	t.is(testSnippet.kenv, "")
})

ava("parseSnippets - snippet without metadata", async (t) => {
	const content = `console.log("No metadata");`
	const filePath = await createTempSnippet("no-metadata-snippet.txt", content)

	const snippets = await parseSnippets()
	const testSnippet = snippets.find((s) => s.filePath === filePath)

	t.truthy(testSnippet)
	t.is(testSnippet.name, filePath)
	t.is(testSnippet.tag, "")
	t.is(testSnippet.text.trim(), content)
})

ava("parseSnippets - snippet with HTML content", async (t) => {
	const content = `
// Name: HTML Snippet
<div>
  <h1>Hello, world!</h1>
</div>
  `.trim()

	await createTempSnippet("html-snippet.txt", content)

	const snippets = await parseSnippets()
	const testSnippet = snippets.find((s) => s.name === "HTML Snippet")

	t.truthy(testSnippet)
	t.is(testSnippet.name, "HTML Snippet")
	t.is(testSnippet.text.trim(), "<div>\n  <h1>Hello, world!</h1>\n</div>")
	t.is(
		testSnippet.preview,
		'<div class="p-4">&lt;div&gt;<br/>  &lt;h1&gt;Hello, world!&lt;/h1&gt;<br/>&lt;/div&gt;</div>'
	)
})

ava("parseSnippets - multiple snippets", async (t) => {
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

	await createTempSnippet("snippet1.txt", snippet1)
	await createTempSnippet("snippet2.txt", snippet2)

	const snippets = await parseSnippets()
	const testSnippets = snippets.filter(
		(s) => s.name === "Snippet 1" || s.name === "Snippet 2"
	)

	t.is(testSnippets.length, 2)
	t.is(testSnippets[0].tag, "s1")
	t.is(testSnippets[1].tag, "s2")
	t.is(testSnippets[0].value, 'console.log("Snippet 1");')
	t.is(testSnippets[1].value, 'console.log("Snippet 2");')
})

// Clean up temporary files after all tests
ava.after.always(async () => {
	const snippetDir = path.join(kenvPath(), "snippets")
	await rmdir(snippetDir, { recursive: true })
})
