import ava from "ava"
import { groupChoices } from "./group"
import type { Choice } from "../types"

ava("groupChoices - basic grouping", (t) => {
	const choices: Choice[] = [
		{ name: "A1", group: "A" },
		{ name: "B1", group: "B" },
		{ name: "A2", group: "A" },
		{ name: "C1", group: "C" }
	]

	const result = groupChoices(choices)

	t.is(result.length, 3)
	t.is(result[0].name, "A")
	t.is(result[0].choices.length, 2)
	t.is(result[1].name, "B")
	t.is(result[1].choices.length, 1)
	t.is(result[2].name, "C")
	t.is(result[2].choices.length, 1)
})

ava("groupChoices - missing group", (t) => {
	const choices: Choice[] = [
		{ name: "A1", group: "A" },
		{ name: "NoGroup" },
		{ name: "B1", group: "B" }
	]

	const result = groupChoices(choices)

	t.is(result.length, 3)
	t.is(result[2].name, "No Group")
	t.is(result[2].choices.length, 1)
	t.is(result[2].choices[0].name, "NoGroup")
})

ava("groupChoices - custom missing group name", (t) => {
	const choices: Choice[] = [
		{ name: "A1", group: "A" },
		{ name: "NoGroup" },
		{ name: "B1", group: "B" }
	]

	const result = groupChoices(choices, { missingGroupName: "Ungrouped" })

	t.is(result.length, 3)
	t.is(result[2].name, "Ungrouped")
	t.is(result[2].choices.length, 1)
	t.is(result[2].choices[0].name, "NoGroup")
})

ava("groupChoices - order", (t) => {
	const choices: Choice[] = [
		{ name: "B1", group: "B" },
		{ name: "A1", group: "A" },
		{ name: "C1", group: "C" }
	]

	const result = groupChoices(choices, { order: ["C", "A", "B"] })

	t.is(result[0].name, "C")
	t.is(result[1].name, "A")
	t.is(result[2].name, "B")
})

ava("groupChoices - endOrder", (t) => {
	const choices: Choice[] = [
		{ name: "B1", group: "B" },
		{ name: "A1", group: "A" },
		{ name: "C1", group: "C" },
		{ name: "D1", group: "D" }
	]

	const result = groupChoices(choices, { endOrder: ["C", "D"] })

	console.log({ result })

	t.is(result[0].name, "A")
	t.is(result[1].name, "B")
	t.is(result[2].name, "D")
	t.is(result[3].name, "C")
})

ava("groupChoices - order and endOrder combined", (t) => {
	const choices: Choice[] = [
		{ name: "B1", group: "B" },
		{ name: "A1", group: "A" },
		{ name: "C1", group: "C" },
		{ name: "D1", group: "D" },
		{ name: "E1", group: "E" }
	]

	const result = groupChoices(choices, {
		order: ["A", "B"],
		endOrder: ["D", "E"]
	})

	t.is(result[0].name, "A")
	t.is(result[1].name, "B")
	t.is(result[2].name, "C")
	t.is(result[3].name, "E")
	t.is(result[4].name, "D")
})

ava("groupChoices - sortChoicesKey", (t) => {
	const choices: Choice[] = [
		{ name: "A2", group: "A", value: 2 },
		{ name: "A1", group: "A", value: 1 },
		{ name: "B1", group: "B", value: 1 }
	]

	const result = groupChoices(choices, { sortChoicesKey: ["value"] })

	t.is(result[0].choices[0].name, "A1")
	t.is(result[0].choices[1].name, "A2")
})

ava("groupChoices - recentKey and recentLimit", (t) => {
	const choices: Choice[] = [
		{ name: "A1", group: "A", lastUsed: 3 },
		{ name: "A2", group: "A", lastUsed: 1 },
		{ name: "B1", group: "B", lastUsed: 2 },
		{ name: "C1", group: "C" }
	] as Choice[]

	const result = groupChoices(choices, {
		recentKey: "lastUsed",
		recentLimit: 2
	})

	t.is(result[0].name, "Recent")
	t.is(result[0].choices.length, 2)
	t.is(result[0].choices[0].name, "A1")
	t.is(result[0].choices[1].name, "B1")
})

ava("groupChoices - hideWithoutInput", (t) => {
	const choices: Choice[] = [
		{ name: "A1", group: "A" },
		{ name: "B1", group: "B" },
		{ name: "C1", group: "C" }
	]

	const result = groupChoices(choices, { hideWithoutInput: ["B"] })

	t.true(result[1].hideWithoutInput)
	t.falsy(result[0].hideWithoutInput)
	t.falsy(result[2].hideWithoutInput)
})

ava("groupChoices - excludeGroups", (t) => {
	const choices: Choice[] = [
		{ name: "A1", group: "A" },
		{ name: "B1", group: "B" },
		{ name: "C1", group: "C" }
	]

	const result = groupChoices(choices, { excludeGroups: ["B"] })

	t.is(result[1].choices[0].exclude, true)
	t.is(result[0].choices[0].exclude, undefined)
	t.is(result[2].choices[0].exclude, undefined)
})

ava("groupChoices - pass group", (t) => {
	const choices: Choice[] = [
		{ name: "A1", group: "A" },
		{ name: "Pass1", pass: true },
		{ name: "B1", group: "B" }
	]

	const result = groupChoices(choices)

	t.is(result[result.length - 1].name, 'Pass "{input}" to...')
	t.is(result[result.length - 1].choices.length, 1)
	t.is(result[result.length - 1].choices[0].name, "Pass1")
})

ava("groupChoices - tagger function", (t) => {
	const choices: Choice[] = [
		{ name: "A1", group: "A" },
		{ name: "B1", group: "B" }
	]

	const tagger = (choice: Choice) => {
		;(choice as any).tagged = true
	}

	const result = groupChoices(choices, { tagger })

	t.true((result[0].choices[0] as any).tagged)
	t.true((result[1].choices[0] as any).tagged)
})

ava("groupChoices - preview handling", (t) => {
	const choices: Choice[] = [
		{ name: "A1", group: "A", preview: "<div>Preview A1</div>" },
		{ name: "A2", group: "A" },
		{ name: "B1", group: "B", preview: "<div>Preview B1</div>" }
	]

	const result = groupChoices(choices)

	t.is(result[0].preview, "<div>Preview A1</div>")
	t.true(result[0].hasPreview)
	t.is(result[1].preview, "<div>Preview B1</div>")
	t.true(result[1].hasPreview)
})

ava("groupChoices - userGrouped sorting", (t) => {
	const choices: Choice[] = [
		{ name: "A1", group: "A" },
		{ name: "B1" },
		{ name: "C1", group: "C" }
	]

	const result = groupChoices(choices)

	t.is(result[0].name, "A")
	t.is(result[1].name, "C")
	t.is(result[2].name, "No Group")
})

ava("groupChoices - empty input", (t) => {
	const result = groupChoices([])

	t.is(result.length, 0)
})

ava("groupChoices - case insensitive ordering", (t) => {
	const choices: Choice[] = [
		{ name: "b1", group: "b" },
		{ name: "A1", group: "A" },
		{ name: "c1", group: "c" }
	]

	const result = groupChoices(choices, { order: ["a", "B", "C"] })

	t.is(result[0].name, "A")
	t.is(result[1].name, "b")
	t.is(result[2].name, "c")
})

ava("groupChoices - multiple sortChoicesKey", (t) => {
	const choices: Choice[] = [
		{ name: "A2", group: "A", value: 2, secondaryValue: 1 },
		{ name: "A1", group: "A", value: 1, secondaryValue: 2 },
		{ name: "B1", group: "B", value: 1, secondaryValue: 1 }
	] as any[]

	const result = groupChoices(choices, {
		sortChoicesKey: ["value", "secondaryValue"]
	})

	t.is(result[0].choices[0].name, "A1")
	t.is(result[0].choices[1].name, "A2")
})

ava("groupChoices - custom groupKey", (t) => {
	const choices: Choice[] = [
		{ name: "A1", customGroup: "A" },
		{ name: "B1", customGroup: "B" },
		{ name: "C1", customGroup: "C" }
	] as any[]

	const result = groupChoices(choices, { groupKey: "customGroup" })

	t.is(result.length, 3)
	t.is(result[0].name, "A")
	t.is(result[1].name, "B")
	t.is(result[2].name, "C")
})

ava("groupChoices - recent choices with custom recent flag", (t) => {
	const choices: Choice[] = [
		{ name: "A1", group: "A", lastUsed: 3, recent: true },
		{ name: "A2", group: "A", lastUsed: 1, recent: false },
		{ name: "B1", group: "B", lastUsed: 2 },
		{ name: "C1", group: "C" }
	] as Choice[]

	const result = groupChoices(choices, {
		recentKey: "lastUsed",
		recentLimit: 2
	})

	t.is(result[0].name, "Recent")
	t.is(result[0].choices.length, 2)
	t.is(result[0].choices[0].name, "A1")
	t.is(result[0].choices[1].name, "B1")
})

ava("groupChoices - pass group with previewPath", (t) => {
	const choices: Choice[] = [
		{ name: "A1", group: "A" },
		{ name: "Pass1", pass: true, previewPath: "path/to/preview" },
		{ name: "B1", group: "B" }
	]

	const result = groupChoices(choices)

	t.is(result[result.length - 1].name, 'Pass "{input}" to...')
	t.is(result[result.length - 1].choices.length, 1)
	t.is(result[result.length - 1].choices[0].name, "Pass1")
	t.is(result[result.length - 1].choices[0].previewPath, "path/to/preview")
	t.is(result[result.length - 1].choices[0].preview, undefined)
})

ava("groupChoices - benchmark performance", (t) => {
	const createChoices = (): Choice[] => {
		return Array.from({ length: 1000 }, (_, i) => ({
			name: `Choice${i + 1}`,
			group: `Group${Math.floor(i / 3) + 1}`,
			value: Math.random()
		}))
	}

	const benchmarkGroupChoices = () => {
		const iterations = 10000
		const choices = createChoices()
		const startTime = process.hrtime()

		for (let i = 0; i < iterations; i++) {
			groupChoices(choices, { sortChoicesKey: ["value"] })
		}

		const [seconds, nanoseconds] = process.hrtime(startTime)
		const totalTimeMs = seconds * 1000 + nanoseconds / 1e6
		const averageTimeMs = totalTimeMs / iterations

		return averageTimeMs
	}

	const averageTime = benchmarkGroupChoices()
	t.log(`Average time per groupChoices call: ${averageTime.toFixed(3)} ms`)
	t.pass()
})
