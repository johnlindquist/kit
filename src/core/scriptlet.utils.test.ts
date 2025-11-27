import ava from "ava"
import { processConditionals } from "./scriptlet.utils"

ava("processConditionals with simple if condition", (t) => {
	const input = "Hello {{#if greet}}world{{/if}}!"
	t.is(processConditionals(input, { greet: "true" }), "Hello world!")
	t.is(processConditionals(input, {}), "Hello !")
})

ava("processConditionals with if-else condition", (t) => {
	const input = "{{#if greet}}Hello{{else}}Goodbye{{/if}} world!"
	t.is(processConditionals(input, { greet: "true" }), "Hello world!")
	t.is(processConditionals(input, {}), "Goodbye world!")
})

ava("processConditionals with if-else if-else condition", (t) => {
	const input =
		"{{#if morning}}Good morning{{else if afternoon}}Good afternoon{{else}}Good evening{{/if}}!"
	t.is(processConditionals(input, { morning: "true" }), "Good morning!")
	t.is(processConditionals(input, { afternoon: "true" }), "Good afternoon!")
	t.is(processConditionals(input, {}), "Good evening!")
})

ava("processConditionals with nested conditions", (t) => {
	const input =
		"{{#if outer}}Outer {{#if inner}}Inner{{else}}Not Inner{{/if}}{{else}}Not Outer{{/if}}"
	t.is(
		processConditionals(input, { outer: "true", inner: "true" }),
		"Outer Inner"
	)
	t.is(processConditionals(input, { outer: "true" }), "Outer Not Inner")
	t.is(processConditionals(input, { inner: "true" }), "Not Outer")
	t.is(processConditionals(input, {}), "Not Outer")
})

ava("processConditionals with multiple conditions in one string", (t) => {
	const input = "{{#if a}}A{{/if}} {{#if b}}B{{/if}} {{#if c}}C{{/if}}"
	t.is(processConditionals(input, { a: "true", b: "true", c: "true" }), "A B C")
	t.is(processConditionals(input, { a: "true", c: "true" }), "A C") // Whitespace is now normalized
	t.is(processConditionals(input, {}), " ") // Whitespace is now normalized
})

ava("processConditionals with empty conditions", (t) => {
	const input = "{{#if empty}}{{/if}}Not empty"
	t.is(processConditionals(input, { empty: "true" }), "Not empty")
	t.is(processConditionals(input, {}), "Not empty")
})

ava("processConditionals with complex nested conditions", (t) => {
	const input =
		"{{#if a}}A{{#if b}}B{{#if c}}C{{else}}Not C{{/if}}{{else}}Not B{{/if}}{{else}}Not A{{/if}}"
	t.is(processConditionals(input, { a: "true", b: "true", c: "true" }), "ABC")
	t.is(processConditionals(input, { a: "true", b: "true" }), "ABNot C")
	t.is(processConditionals(input, { a: "true" }), "ANot B")
	t.is(processConditionals(input, {}), "Not A")
})

ava("processConditionals with multiple else-if conditions", (t) => {
	const input =
		"{{#if a}}A{{else if b}}B{{else if c}}C{{else if d}}D{{else}}E{{/if}}"
	t.is(processConditionals(input, { a: "true" }), "A")
	t.is(processConditionals(input, { b: "true" }), "B")
	t.is(processConditionals(input, { c: "true" }), "C")
	t.is(processConditionals(input, { d: "true" }), "D")
	t.is(processConditionals(input, {}), "E")
})

ava(
	"processConditionals with conditions containing special characters",
	(t) => {
		const input = "{{#if special-char}}Special{{else}}Not Special{{/if}}"
		t.is(processConditionals(input, { "special-char": "true" }), "Special")
		t.is(processConditionals(input, {}), "Not Special")
	}
)

ava("processConditionals with conditions in different order", (t) => {
	const input = "{{#if z}}Z{{/if}}{{#if y}}Y{{/if}}{{#if x}}X{{/if}}"
	t.is(processConditionals(input, { z: "true", y: "true", x: "true" }), "ZYX")
	t.is(processConditionals(input, { x: "true", z: "true" }), "ZX")
})

ava("processConditionals with non-boolean flag values", (t) => {
	const input = "{{#if number}}Number{{else}}Not Number{{/if}}"
	t.is(processConditionals(input, { number: "0" }), "Number")
	t.is(processConditionals(input, { number: "" }), "Not Number")
})

ava(
	"processConditionals with multiple else-if conditions and nested content",
	(t) => {
		const input =
			"{{#if a}}A{{else if b}}B{{#if nested}}Nested{{/if}}{{else if c}}C{{else}}D{{/if}}"
		t.is(processConditionals(input, { a: "true" }), "A")
		t.is(processConditionals(input, { b: "true", nested: "true" }), "BNested")
		t.is(processConditionals(input, { b: "true" }), "B")
		t.is(processConditionals(input, { c: "true" }), "C")
		t.is(processConditionals(input, {}), "D")
	}
)

ava(
	"processConditionals with multiple else-if conditions and empty content",
	(t) => {
		const input = "{{#if a}}A{{else if b}}{{else if c}}C{{else}}D{{/if}}"
		t.is(processConditionals(input, { a: "true" }), "A")
		t.is(processConditionals(input, { b: "true" }), "")
		t.is(processConditionals(input, { c: "true" }), "C")
		t.is(processConditionals(input, {}), "D")
	}
)

ava(
	"processConditionals with multiple else-if conditions and special characters",
	(t) => {
		const input = "{{#if a}}A{{else if b-1}}B1{{else if c_2}}C2{{else}}D{{/if}}"
		t.is(processConditionals(input, { a: "true" }), "A")
		t.is(processConditionals(input, { "b-1": "true" }), "B1")
		t.is(processConditionals(input, { c_2: "true" }), "C2")
		t.is(processConditionals(input, {}), "D")
	}
)

ava(
	"processConditionals with multiple else-if conditions and whitespace - Don't allow whitespace between conditional curlies",
	(t) => {
		const input = "{{#if a}}A{{else if b }}B{{else if c }}C{{else}}D{{/if}}"
		t.is(
			processConditionals(input, { a: "true" }),
			"A{{else if b }}B{{else if c }}C"
		)
		t.is(processConditionals(input, { b: "true" }), "D")
		t.is(processConditionals(input, { c: "true" }), "D")
		t.is(processConditionals(input, {}), "D")
	}
)

ava(
	"processConditionals with multiple else-if conditions and multiline content",
	(t) => {
		const input = `{{#if a}}
A
{{else if b}}
B
{{else if c}}
C
{{else}}
D
{{/if}}`
		t.is(processConditionals(input, { a: "true" }), "\nA\n")
		t.is(processConditionals(input, { b: "true" }), "\nB\n")
		t.is(processConditionals(input, { c: "true" }), "\nC\n")
		t.is(processConditionals(input, {}), "\nD\n")
	}
)
