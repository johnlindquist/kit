import ava from "ava"
import { getSnippet } from "./snippets.js"
import { parseSnippets } from "./utils.js"
import path from 'node:path'
import { kenvPath } from '../core/utils.js'
import { outputFile, ensureDir } from 'fs-extra'
import tmp from "tmp-promise"

ava("getSnippet - basic metadata and snippet", (t) => {
	const content = `
// Name: Test Snippet
// Tag: test
This is a test snippet
with multiple lines
`.trim()
	const result = getSnippet(content)

	t.log({ result })

	t.deepEqual(result.metadata, { name: "Test Snippet", tag: "test" })
	t.is(result.snippet.trim(), "This is a test snippet\nwith multiple lines")
})

ava("getSnippet - no metadata", (t) => {
	const content = "This is a snippet without metadata"
	const result = getSnippet(content)

	t.deepEqual(result.metadata, {})
	t.is(result.snippet.trim(), "This is a snippet without metadata")
})

ava("getSnippet - snippet with metadata-like content", (t) => {
	const content = `
// Name: Tricky Snippet
// Tag: tricky
This is a snippet
// This line looks like metadata but isn't
# This one too
`.trim()
	const result = getSnippet(content)

	t.log({ result })

	t.deepEqual(result.metadata, { name: "Tricky Snippet", tag: "tricky" })
	t.is(
		result.snippet.trim(),
		`This is a snippet
// This line looks like metadata but isn't
# This one too`
	)
})

ava("getSnippet - empty content", (t) => {
	const content = ""
	const result = getSnippet(content)

	t.deepEqual(result.metadata, {})
	t.is(result.snippet, "")
})

ava('parseSnippets - snippet in kenv directory', async (t) => {
	const { path: tmpDir } = await tmp.dir()
	process.env.KENV = tmpDir
	global.kitScript = `${Date.now()}.js`
	global.__kitDbMap = new Map()
	await ensureDir(kenvPath('snippets'))

	// Create a snippet file inside a kenv-specific directory.
	const snippetContent = `
// Name: Kenv Snippet
// Snippet: kenvTest
console.log("Kenv snippet");
`.trim()
	const testKenvDir = kenvPath('kenvs', 'test', 'snippets')
	await ensureDir(testKenvDir)
	const filePath = path.join(testKenvDir, 'kenv-snippet.txt')
	await outputFile(filePath, snippetContent)

	const snippets = await parseSnippets()
	const found = snippets.find(s => s.name === 'Kenv Snippet')
	t.truthy(found)
	t.is(found!.tag, 'kenvTest')
	t.is(found!.kenv, 'test')
})

ava('parseSnippets - snippet with postfix expand marker', async (t) => {
	const { path: tmpDir } = await tmp.dir()
	process.env.KENV = tmpDir
	global.kitScript = `${Date.now()}.js`
	global.__kitDbMap = new Map()
	await ensureDir(kenvPath('snippets'))

	const snippetContent = `
// Name: Postfix Snippet
// Snippet: *postfixTest
console.log("Postfix snippet");
`.trim()
	const filePath = path.join(kenvPath('snippets'), 'postfix-snippet.txt')
	await outputFile(filePath, snippetContent)

	const snippets = await parseSnippets()
	const found = snippets.find(s => s.name === 'Postfix Snippet')
	t.truthy(found)
	t.is(found!.expand, 'postfixTest')
	t.is(found!.postfix, true)
})

ava('parseSnippets - snippet with missing expand metadata', async (t) => {
	const { path: tmpDir } = await tmp.dir()
	process.env.KENV = tmpDir
	global.kitScript = `${Date.now()}.js`
	global.__kitDbMap = new Map()
	await ensureDir(kenvPath('snippets'))

	const snippetContent = `
// Name: No Expand Snippet
// SomeMeta: value
console.log("No expand snippet");
`.trim()
	await ensureDir(kenvPath('snippets'))
	const filePath = path.join(kenvPath('snippets'), 'no-expand-snippet.txt')
	await outputFile(filePath, snippetContent)
	const snippets = await parseSnippets()
	const found = snippets.find(s => s.name === 'No Expand Snippet')
	t.truthy(found)
	t.is(found!.expand, '')
	t.is(found!.postfix, false)
})

ava('parseSnippets - snippet with extra whitespace', async (t) => {
	const { path: tmpDir } = await tmp.dir()
	process.env.KENV = tmpDir
	global.kitScript = `${Date.now()}.js`
	global.__kitDbMap = new Map()
	await ensureDir(kenvPath('snippets'))

	const snippetContent = `
// Name: Whitespace Snippet
// Snippet: wsTest

console.log("Whitespace snippet");

`.trim()
	await ensureDir(kenvPath('snippets'))
	const filePath = path.join(kenvPath('snippets'), 'whitespace-snippet.txt')
	await outputFile(filePath, snippetContent)
	const snippets = await parseSnippets()
	t.log({ snippets })
	const found = snippets.find(s => s.name === 'Whitespace Snippet')
	t.truthy(found)
	// The snippet text should be trimmed.
	t.is(found!.text, 'console.log("Whitespace snippet");')
})

ava('parseSnippets - empty snippet file', async (t) => {
	const { path: tmpDir } = await tmp.dir()
	process.env.KENV = tmpDir
	global.kitScript = `${Date.now()}.js`
	global.__kitDbMap = new Map()
	await ensureDir(kenvPath('snippets'))

	const snippetContent = ''
	await ensureDir(kenvPath('snippets'))
	const filePath = path.join(kenvPath('snippets'), 'empty-snippet.txt')
	await outputFile(filePath, snippetContent)
	const snippets = await parseSnippets()

	// Normalize paths for comparison
	const normalizedFilePath = path.normalize(filePath)
	const found = snippets.find(s => path.normalize(s.filePath) === normalizedFilePath)
	t.truthy(found, `Expected to find snippet with path ${normalizedFilePath} in snippets: ${JSON.stringify(snippets.map(s => ({ path: s.filePath, name: s.name })), null, 2)}`)
	t.is(found!.text, '')
})

ava('parseSnippets - multiple snippets in temporary directory', async (t) => {
	const { path: tmpDir } = await tmp.dir()
	process.env.KENV = tmpDir
	global.kitScript = `${Date.now()}.js`
	global.__kitDbMap = new Map()
	await ensureDir(kenvPath('snippets'))

	const content1 = `
// Name: Multi Snippet 1
// Snippet: m1
console.log("Snippet 1");
`.trim()
	const content2 = `
// Name: Multi Snippet 2
// Snippet: m2
console.log("Snippet 2");
`.trim()
	const filePath1 = path.join(kenvPath('snippets'), 'multi-snippet1.txt')
	const filePath2 = path.join(kenvPath('snippets'), 'multi-snippet2.txt')
	await outputFile(filePath1, content1)
	await outputFile(filePath2, content2)
	const snippets = await parseSnippets()
	const found1 = snippets.find(s => s.name === 'Multi Snippet 1')
	const found2 = snippets.find(s => s.name === 'Multi Snippet 2')
	t.truthy(found1)
	t.truthy(found2)
	t.is(found1!.tag, 'm1')
	t.is(found2!.tag, 'm2')
})
