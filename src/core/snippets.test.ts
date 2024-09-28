import ava from "ava"
import { getSnippet } from "./snippets"

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
