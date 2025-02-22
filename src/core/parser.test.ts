import ava from "ava"
import { postprocessMetadata } from "./parser.js"
import { getMetadata } from "./utils.js"
import { ProcessType } from "./enum.js"
import type { Metadata, ScriptMetadata } from "../types/core.js"

ava("postprocessMetadata - basic metadata processing", (t) => {
	const metadata = {
		shortcut: "cmd+shift+p",
		shortcode: "TEST",
		trigger: "TEST_TRIGGER",
		alias: "Test Alias",
		image: "~/images/test.png"
	} satisfies Metadata
	const fileContents = ""

	const result = postprocessMetadata(metadata, fileContents)

	if (process.platform === "darwin") {
		t.is(result.shortcut, "Command+Shift+p")
		t.is(result.friendlyShortcut, "cmd+shift+p")
	} else {
		t.is(result.shortcut, "Control+Shift+p")
		t.is(result.friendlyShortcut, "ctrl+shift+p")
	}
	t.is(result.shortcode, "test")
	t.is(result.trigger, "test_trigger")
	t.is(result.alias, "test alias")
	t.truthy(result.img)
	t.is(result.type, ProcessType.Prompt)
})

ava("postprocessMetadata - process type determination", (t) => {
	const testCases = [
		{ metadata: { schedule: true }, expected: ProcessType.Schedule },
		{ metadata: { watch: true }, expected: ProcessType.Watch },
		{ metadata: { system: true }, expected: ProcessType.System },
		{ metadata: { background: true }, expected: ProcessType.Background },
		{ metadata: {}, expected: ProcessType.Prompt }
	] as { metadata: Metadata; expected: ProcessType }[]

	for (const { metadata, expected } of testCases) {
		const result = postprocessMetadata(metadata, "")
		t.is(result.type, expected)
	}
})

ava("postprocessMetadata - tabs extraction", (t) => {
	const fileContents = `
onTab('Tab1', async ()=>  {
    await arg("one")
})
onTab('Tab2', async ()=>  {
    await arg("one")
})
    `

	const result = postprocessMetadata({}, fileContents)

	t.deepEqual(result.tabs, ["Tab1", "Tab2"])
})

ava("postprocessMetadata - index processing", (t) => {
	const testCases = [
		{ metadata: { index: "123" }, expected: 123 },
		{ metadata: { index: 456 }, expected: 456 },
		{ metadata: { index: "0" }, expected: 0 },
		{ metadata: { index: "-1" }, expected: -1 },
		{ metadata: {}, expected: undefined }
	] as { metadata: Metadata; expected: number | undefined }[]

	for (const { metadata, expected } of testCases) {
		const result = postprocessMetadata(metadata, "")
		t.is(result.index, expected)
	}
})


ava("postprocessMetadata - hasPreview detection", (t) => {
	const testCases = [
		{ fileContents: "preview: true", expected: true },
		{ fileContents: "preview = true", expected: true },
		{ fileContents: "preview:true", expected: true },
		{ fileContents: "preview=true", expected: true },
		{ fileContents: "no preview here", expected: undefined }
	]

	for (const { fileContents, expected } of testCases) {
		const result = postprocessMetadata({}, fileContents)
		t.is(result.hasPreview, expected)
	}
})

ava("postprocessMetadata - empty input", (t) => {
	const result = postprocessMetadata({}, "")

	t.deepEqual(result, { type: ProcessType.Prompt })
})

ava("postprocessMetadata - ignores URLs in comments", (t) => {
	const fileContents = `
// Get the API key (https://google.com)
// TODO: Check docs at http://example.com
// Regular metadata: value
	`
	const result = postprocessMetadata({}, fileContents)

	// Should only have type since URLs should be ignored
	t.deepEqual(result, { type: ProcessType.Prompt })
})

ava("getMetadata - ignores invalid metadata keys", (t) => {
	const fileContents = `
// Get the API key (https://google.com): some value
// TODO: Check docs at http://example.com
// Regular metadata: value
// Name: Test Script
// Description: A test script
// Invalid key with spaces: value
// Invalid/key/with/slashes: value
// Invalid-key-with-hyphens: value
	`
	const result = getMetadata(fileContents)

	// Should only parse valid metadata keys
	t.deepEqual(result, {
		name: "Test Script",
		description: "A test script"
	})
})

ava("getMetadata - handles various whitespace patterns", (t) => {
	const fileContents = `
//Name:First Value
//Name: Second Value
// Name:Third Value
// Name: Fourth Value
//  Name:Fifth Value
//  Name: Sixth Value
//	Name:Tab Value
//	Name: Tabbed Value
	`
	const result = getMetadata(fileContents)

	// Should use the first occurrence of each key and handle all whitespace patterns
	t.deepEqual(result, {
		name: "First Value"
	})

	// Test each pattern individually to ensure they all work
	t.deepEqual(getMetadata("//Name:Test"), { name: "Test" })
	t.deepEqual(getMetadata("//Name: Test"), { name: "Test" })
	t.deepEqual(getMetadata("// Name:Test"), { name: "Test" })
	t.deepEqual(getMetadata("// Name: Test"), { name: "Test" })
	t.deepEqual(getMetadata("//  Name:Test"), { name: "Test" })
	t.deepEqual(getMetadata("//  Name: Test"), { name: "Test" })
	t.deepEqual(getMetadata("//\tName:Test"), { name: "Test" })
	t.deepEqual(getMetadata("//\tName: Test"), { name: "Test" })
})
