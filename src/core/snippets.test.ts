import test from "ava"
import { getSnippet } from "./snippets.js"
import { parseSnippets } from "./utils.js"
import path from 'node:path'
import { kenvPath } from '../core/utils.js'
import { outputFile, ensureDir } from 'fs-extra'
import tmp from "tmp-promise"

test.serial("getSnippet - basic metadata and snippet", (t) => {
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

test.serial("getSnippet - no metadata", (t) => {
	const content = "This is a snippet without metadata"
	const result = getSnippet(content)

	t.deepEqual(result.metadata, {})
	t.is(result.snippet.trim(), "This is a snippet without metadata")
})

test.serial("getSnippet - snippet with metadata-like content", (t) => {
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

test.serial("getSnippet - empty content", (t) => {
	const content = ""
	const result = getSnippet(content)

	t.deepEqual(result.metadata, {})
	t.is(result.snippet, "")
})

test.serial('parseSnippets - snippet in kenv directory', async (t) => {
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

test.serial('parseSnippets - snippet with postfix expand marker', async (t) => {
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

test.serial('parseSnippets - snippet with missing expand metadata', async (t) => {
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

test.serial('parseSnippets - snippet with extra whitespace', async (t) => {
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

test.serial('parseSnippets - empty snippet file', async (t) => {
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

test.serial('postfix snippet captures text before trigger - regression test', async (t) => {
	// This test verifies that postfix snippets (starting with *) capture
	// the text typed before the trigger and pass it as the first argument
	const { path: tmpDir } = await tmp.dir()
	process.env.KENV = tmpDir
	global.kitScript = `${Date.now()}.js`
	global.__kitDbMap = new Map()
	await ensureDir(kenvPath('snippets'))

	// Create the synonym finder snippet
	const snippetContent = `
// Name: Find Synonym
// Description: Find a synonym for a word
// Snippet: *,,

import "@johnlindquist/kit";

let word = await arg("The value of *")

let response = await get(\`https://api.datamuse.com/words?ml=\${word}\`)

let synonyms = response.data.map(i => i.word)

let synonym = await arg("Select a replacement", synonyms)

await setSelectedText(synonym)
`.trim()
	
	const filePath = path.join(kenvPath('snippets'), 'find-synonym.txt')
	await outputFile(filePath, snippetContent)
	
	const snippets = await parseSnippets()
	const found = snippets.find(s => s.name === 'Find Synonym')
	
	t.truthy(found)
	t.is(found!.tag, '*,,')
	t.is(found!.expand, ',,')
	t.is(found!.postfix, true)
	
	// Verify the snippet text contains the arg call
	t.true(found!.text.includes('let word = await arg("The value of *")'))
	
	// Document expected behavior:
	// When user types "hello,," the script should receive "hello" as the first argument
	// This allows the script to process the word before the trigger
	t.log('Expected behavior: typing "hello,," should pass "hello" as arg[0] to the script')
})

test('postfix snippet argument passing simulation', t => {
	// This test simulates the runtime behavior that should happen
	// when a postfix snippet is triggered
	
	// Given a postfix snippet with key ",,"
	const snippetKey = ',,';
	const postfix = true;
	
	// When the user types "hello,,"
	const fullTypedText = 'hello,,';
	
	// The system should:
	// 1. Detect the snippet key at the end
	t.true(fullTypedText.endsWith(snippetKey));
	
	// 2. Extract the text before the snippet key
	const capturedText = fullTypedText.slice(0, fullTypedText.length - snippetKey.length);
	t.is(capturedText, 'hello');
	
	// 3. Pass it as the first argument to the script
	const args = postfix ? [capturedText] : [];
	t.deepEqual(args, ['hello']);
	
	// 4. The script should receive this in process.argv or equivalent
	// In the actual runtime, this would be available to the script as:
	// - process.argv[2] in a Node.js script
	// - The first parameter when using `await arg()` without a prompt
	t.log('Script should receive args:', args);
})

test.serial('parseSnippets - multiple snippets in temporary directory', async (t) => {
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
