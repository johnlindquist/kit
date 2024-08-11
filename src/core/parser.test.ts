import ava from "ava"
import { postprocessMetadata } from "./parser"
import { ProcessType } from "./enum.js"
import type { Metadata, ScriptMetadata } from "../types"

ava("postprocessMetadata - basic metadata processing", (t) => {
	const metadata = {
		shortcut: "cmd+shift+p",
		shortcode: "TEST",
		trigger: "TEST_TRIGGER",
		alias: "Test Alias",
		image: "~/images/test.png"
	}
	const fileContents = ""

	const result = postprocessMetadata(metadata, fileContents)

	if (process.platform === "darwin") {
		t.is(result.shortcut, "Command+Shift+p")
	}
	t.is(result.friendlyShortcut, "cmd+shift+p")
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

// ... You can add more tests as needed ...
