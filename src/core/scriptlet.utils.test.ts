import ava from "ava"
import { processConditionals } from "./scriptlet.utils"

ava("processConditionals with simple if condition", (t) => {
	const input = "Hello {{#if flag.greet}}world{{/if}}!"
	t.is(processConditionals(input, { greet: "true" }), "Hello world!")
	t.is(processConditionals(input, {}), "Hello !")
})

ava("processConditionals with if-else condition", (t) => {
	const input = "{{#if flag.greet}}Hello{{else}}Goodbye{{/if}} world!"
	t.is(processConditionals(input, { greet: "true" }), "Hello world!")
	t.is(processConditionals(input, {}), "Goodbye world!")
})

ava("processConditionals with if-else if-else condition", (t) => {
	const input =
		"{{#if flag.morning}}Good morning{{else if flag.afternoon}}Good afternoon{{else}}Good evening{{/if}}!"
	t.is(processConditionals(input, { morning: "true" }), "Good morning!")
	t.is(processConditionals(input, { afternoon: "true" }), "Good afternoon!")
	t.is(processConditionals(input, {}), "Good evening!")
})

ava("processConditionals with nested conditions", (t) => {
	const input =
		"{{#if flag.outer}}Outer {{#if flag.inner}}Inner{{else}}Not Inner{{/if}}{{else}}Not Outer{{/if}}"
	t.is(
		processConditionals(input, { outer: "true", inner: "true" }),
		"Outer Inner"
	)
	t.is(processConditionals(input, { outer: "true" }), "Outer Not Inner")
	t.is(processConditionals(input, { inner: "true" }), "Not Outer")
	t.is(processConditionals(input, {}), "Not Outer")
})

ava("processConditionals with multiple conditions in one string", (t) => {
	const input =
		"{{#if flag.a}}A{{/if}} {{#if flag.b}}B{{/if}} {{#if flag.c}}C{{/if}}"
	t.is(processConditionals(input, { a: "true", b: "true", c: "true" }), "A B C")
	t.is(processConditionals(input, { a: "true", c: "true" }), "A  C")
	t.is(processConditionals(input, {}), "  ")
})

ava("processConditionals with empty conditions", (t) => {
	const input = "{{#if flag.empty}}{{/if}}Not empty"
	t.is(processConditionals(input, { empty: "true" }), "Not empty")
	t.is(processConditionals(input, {}), "Not empty")
})

ava("processConditionals with complex nested conditions", (t) => {
	const input =
		"{{#if flag.a}}A{{#if flag.b}}B{{#if flag.c}}C{{else}}Not C{{/if}}{{else}}Not B{{/if}}{{else}}Not A{{/if}}"
	t.is(processConditionals(input, { a: "true", b: "true", c: "true" }), "ABC")
	t.is(processConditionals(input, { a: "true", b: "true" }), "ABNot C")
	t.is(processConditionals(input, { a: "true" }), "ANot B")
	t.is(processConditionals(input, {}), "Not A")
})

ava("processConditionals with multiple else-if conditions", (t) => {
	const input =
		"{{#if flag.a}}A{{else if flag.b}}B{{else if flag.c}}C{{else if flag.d}}D{{else}}E{{/if}}"
	t.is(processConditionals(input, { a: "true" }), "A")
	t.is(processConditionals(input, { b: "true" }), "B")
	t.is(processConditionals(input, { c: "true" }), "C")
	t.is(processConditionals(input, { d: "true" }), "D")
	t.is(processConditionals(input, {}), "E")
})

ava(
	"processConditionals with conditions containing special characters",
	(t) => {
		const input = "{{#if flag.special-char}}Special{{else}}Not Special{{/if}}"
		t.is(processConditionals(input, { "special-char": "true" }), "Special")
		t.is(processConditionals(input, {}), "Not Special")
	}
)

ava("processConditionals with conditions in different order", (t) => {
	const input =
		"{{#if flag.z}}Z{{/if}}{{#if flag.y}}Y{{/if}}{{#if flag.x}}X{{/if}}"
	t.is(processConditionals(input, { z: "true", y: "true", x: "true" }), "ZYX")
	t.is(processConditionals(input, { x: "true", z: "true" }), "ZX")
})

ava("processConditionals with non-boolean flag values", (t) => {
	const input = "{{#if flag.number}}Number{{else}}Not Number{{/if}}"
	t.is(processConditionals(input, { number: "0" }), "Number")
	t.is(processConditionals(input, { number: "" }), "Not Number")
})

ava(
	"processConditionals with multiple else-if conditions and nested content",
	(t) => {
		const input =
			"{{#if flag.a}}A{{else if flag.b}}B{{#if flag.nested}}Nested{{/if}}{{else if flag.c}}C{{else}}D{{/if}}"
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
		const input =
			"{{#if flag.a}}A{{else if flag.b}}{{else if flag.c}}C{{else}}D{{/if}}"
		t.is(processConditionals(input, { a: "true" }), "A")
		t.is(processConditionals(input, { b: "true" }), "")
		t.is(processConditionals(input, { c: "true" }), "C")
		t.is(processConditionals(input, {}), "D")
	}
)

ava(
	"processConditionals with multiple else-if conditions and special characters",
	(t) => {
		const input =
			"{{#if flag.a}}A{{else if flag.b-1}}B1{{else if flag.c_2}}C2{{else}}D{{/if}}"
		t.is(processConditionals(input, { a: "true" }), "A")
		t.is(processConditionals(input, { "b-1": "true" }), "B1")
		t.is(processConditionals(input, { c_2: "true" }), "C2")
		t.is(processConditionals(input, {}), "D")
	}
)

ava(
	"processConditionals with multiple else-if conditions and whitespace - Don't allow whitespace between conditional curlies",
	(t) => {
		const input =
			"{{#if flag.a}}A{{else if flag.b }}B{{else if flag.c }}C{{else}}D{{/if}}"
		t.is(
			processConditionals(input, { a: "true" }),
			"A{{else if flag.b }}B{{else if flag.c }}C"
		)
		t.is(processConditionals(input, { b: "true" }), "D")
		t.is(processConditionals(input, { c: "true" }), "D")
		t.is(processConditionals(input, {}), "D")
	}
)

ava(
	"processConditionals with multiple else-if conditions and multiline content",
	(t) => {
		const input = `{{#if flag.a}}
A
{{else if flag.b}}
B
{{else if flag.c}}
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
