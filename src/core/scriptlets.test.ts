import ava from "ava"
import type { Scriptlet } from "../types"
import { parseMarkdownAsScriptlets, home, kenvPath } from "./utils"
import { formatScriptlet } from "./scriptlets"
import * as os from "node:os"

// Helper function to create a temporary snippet file
process.env.KENV = home(".mock-kenv")
ava.before(async () => {
	await ensureDir(kenvPath("snippets"))
	await ensureDir(kenvPath("tmp"))
})

ava("parseMarkdownAsScripts projects.md", async (t) => {
	let markdown = `
## Github PR AI Review

\`\`\`
cursor ~/dev/github-action-list-files-on-push
\`\`\`

## Github PR AI Review Playground

\`\`\`
cursor /Users/johnlindquist/dev/github-action-pr
\`\`\`

## Github PR AI Review Playground URL

\`\`\`open
https://github.com/time-loop/pr-ai-action-playground
\`\`\`

`.trim()

	const scripts = await parseMarkdownAsScriptlets(markdown)

	t.is(scripts.length, 3)

	t.is(scripts[0].name, "Github PR AI Review")
	t.is(scripts[0].tool, process.platform === "win32" ? "cmd" : "bash")
	t.is(scripts[0].scriptlet, "cursor ~/dev/github-action-list-files-on-push")

	t.is(scripts[1].name, "Github PR AI Review Playground")
	t.is(scripts[2].name, "Github PR AI Review Playground URL")
})

ava("parseMarkdownAsScripts projects.md with Shortcut", async (t) => {
	let markdown = `
# Projects
<!--
Shortcut: opt p
-->

## Github PR AI Review

\`\`\`
cursor ~/dev/github-action-list-files-on-push
\`\`\`

## Github PR AI Review Playground

\`\`\`
cursor /Users/johnlindquist/dev/github-action-pr
\`\`\`

## Github PR AI Review Playground URL

\`\`\`open
https://github.com/time-loop/pr-ai-action-playground
\`\`\`

`.trim()

	const scripts = await parseMarkdownAsScriptlets(markdown)

	t.is(scripts.length, 4)
	t.is(scripts[0].name, "Projects")
	t.is(scripts[0].exclude, true)
	t.is(scripts[0].group, undefined)

	t.is(scripts[1].name, "Github PR AI Review")
	t.is(scripts[1].group, "Projects")
	t.is(scripts[1].tool, process.platform === "win32" ? "cmd" : "bash")
	t.is(scripts[1].scriptlet, "cursor ~/dev/github-action-list-files-on-push")

	t.is(scripts[2].name, "Github PR AI Review Playground")
	t.is(scripts[3].name, "Github PR AI Review Playground URL")
})

ava(
	"parseMarkdownAsScriptlets with conditional flag - ignore else from input",
	async (t) => {
		let markdown = `
## Conditional Flag Test

\`\`\`bash
{{#if cmd}}
open https://github.com/time-loop/pr-ai-action-playground
{{else}}
cursor /Users/johnlindquist/dev/github-action-pr
{{/if}}
\`\`\`
`

		const scripts = await parseMarkdownAsScriptlets(markdown)
		t.is(scripts.length, 1)
		t.is(scripts[0].name, "Conditional Flag Test")
		t.is(scripts[0].tool, "bash")
		t.is(
			scripts[0].scriptlet,
			`{{#if cmd}}
open https://github.com/time-loop/pr-ai-action-playground
{{else}}
cursor /Users/johnlindquist/dev/github-action-pr
{{/if}}`
		)
		t.deepEqual(scripts[0].inputs, [])
	}
)

ava(
	"parseMarkdownAsScriptlets with template tool and variables",
	async (t) => {
		let templateString = "${1|Sincerely,Dearly|}, John"
		let markdown = `
## Sign Off

~~~template
${templateString}
~~~

`

		const scripts = await parseMarkdownAsScriptlets(markdown)
		t.is(scripts.length, 1)
		t.is(scripts[0].name, "Sign Off")
		t.is(scripts[0].tool, "template")
		t.is(scripts[0].scriptlet, templateString)
		t.deepEqual(scripts[0].inputs, [])
	}
)

ava("formatScriptlet with conditional flag", async (t) => {
	let markdown = `
## Conditional Flag Test

\`\`\`bash
{{#if cmd}}
open https://github.com/time-loop/pr-ai-action-playground
{{else}}
cursor /Users/johnlindquist/dev/github-action-pr
{{/if}}
\`\`\`
`

	const scripts = await parseMarkdownAsScriptlets(markdown)
	const { formattedScriptlet } = formatScriptlet(scripts[0], [], {
		cmd: "true"
	})
	t.is(
		formattedScriptlet,
		"open https://github.com/time-loop/pr-ai-action-playground"
	)
})

ava("formatScriptlet with multiple conditional flags", async (t) => {
	let markdown = `
## Conditional Flag Test

\`\`\`bash
{{#if cmd}}
open https://github.com/time-loop/pr-ai-action-playground
{{else if shift}}
open /Users/johnlindquist/dev/github-action-pr
{{else}}
cursor /Users/johnlindquist/dev/github-action-pr
{{/if}}
\`\`\`
`

	const scripts = await parseMarkdownAsScriptlets(markdown)
	const { formattedScriptlet } = formatScriptlet(scripts[0], [], {
		cmd: "true"
	})
	t.is(
		formattedScriptlet,
		"open https://github.com/time-loop/pr-ai-action-playground"
	)

	const { formattedScriptlet: result2 } = formatScriptlet(scripts[0], [], {
		shift: "true"
	})
	t.is(result2, "open /Users/johnlindquist/dev/github-action-pr")
})

ava("formatScriptlet with no flags", (t) => {
	const scriptlet = {
		name: "Test Scriptlet",
		tool: "bash",
		scriptlet:
			"ls {{#if verbose}}-l{{/if}} ~/Downloads {{#if zip}}| grep .zip{{/if}}",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		[],
		{}
	)
	t.is(formattedScriptlet, "ls  ~/Downloads")
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet with verbose flag", (t) => {
	const scriptlet = {
		name: "Test Scriptlet",
		tool: "bash",
		scriptlet:
			"ls {{#if verbose}}-l{{/if}} ~/Downloads {{#if zip}}| grep .zip{{/if}}",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		[],
		{ verbose: "true" }
	)
	t.is(formattedScriptlet, "ls -l ~/Downloads")
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet with zip flag", (t) => {
	const scriptlet = {
		name: "Test Scriptlet",
		tool: "bash",
		scriptlet:
			"ls {{#if verbose}}-l{{/if}} ~/Downloads {{#if zip}}| grep .zip{{/if}}",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		[],
		{ zip: "true" }
	)
	t.is(formattedScriptlet, "ls  ~/Downloads | grep .zip")
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet with both flags", (t) => {
	const scriptlet = {
		name: "Test Scriptlet",
		tool: "bash",
		scriptlet:
			"ls {{#if verbose}}-l{{/if}} ~/Downloads {{#if zip}}| grep .zip{{/if}}",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		[],
		{
			verbose: "true",
			zip: "true"
		}
	)
	t.is(formattedScriptlet, "ls -l ~/Downloads | grep .zip")
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet with nested conditionals", (t) => {
	const scriptlet = {
		name: "Nested Conditional Test",
		tool: "bash",
		scriptlet: "ls {{#if all}}-a {{#if long}}-l{{/if}}{{/if}} ~/Downloads",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet: result1, remainingInputs: remaining1 } =
		formatScriptlet(scriptlet, [], {})
	t.is(result1, "ls  ~/Downloads")
	t.deepEqual(remaining1, [])

	const { formattedScriptlet: result2, remainingInputs: remaining2 } =
		formatScriptlet(scriptlet, [], { all: "true" })
	t.is(result2, "ls -a  ~/Downloads") // Note the two spaces here
	t.deepEqual(remaining2, [])

	const { formattedScriptlet: result3, remainingInputs: remaining3 } =
		formatScriptlet(scriptlet, [], { all: "true", long: "true" })
	t.is(result3, "ls -a -l ~/Downloads")
	t.deepEqual(remaining3, [])

	const { formattedScriptlet: result4, remainingInputs: remaining4 } =
		formatScriptlet(scriptlet, [], { long: "true" })
	t.is(result4, "ls  ~/Downloads")
	t.deepEqual(remaining4, [])
})

ava("formatScriptlet with inputs and flags", (t) => {
	const scriptlet = {
		name: "Input and Flag Test",
		tool: "bash",
		scriptlet:
			"echo {{message}} {{#if uppercase}}| tr '[:lower:]' '[:upper:]'{{/if}}",
		inputs: ["message"]
	} as Scriptlet

	const { formattedScriptlet: result1, remainingInputs: remaining1 } =
		formatScriptlet(scriptlet, ["hello world"], {})
	t.is(result1, "echo hello world")
	t.deepEqual(remaining1, [])

	const { formattedScriptlet: result2, remainingInputs: remaining2 } =
		formatScriptlet(scriptlet, ["hello world"], { uppercase: "true" })
	t.is(result2, "echo hello world | tr '[:lower:]' '[:upper:]'")
	t.deepEqual(remaining2, [])
})

ava("formatScriptlet with $@ input", (t) => {
	const scriptlet = {
		name: "All Arguments Test",
		tool: "bash",
		scriptlet: "echo $@",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		["arg1", "arg2", "arg3"],
		{}
	)
	t.is(formattedScriptlet, 'echo "arg1" "arg2" "arg3"')
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet with numbered inputs", (t) => {
	if (os.platform() === "win32") {
		t.pass("Skipping test on Windows")
		return
	}
	const scriptlet = {
		name: "Numbered Inputs Test",
		tool: "bash",
		scriptlet: "echo $1 $2 $3",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		["first", "second", "third"],
		{}
	)
	t.is(formattedScriptlet, "echo first second third")
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet with Windows-style inputs", (t) => {
	if (os.platform() !== "win32") {
		t.pass("Skipping test on non-Windows platforms")
		return
	}
	const scriptlet = {
		name: "Windows Inputs Test",
		tool: "cmd",
		scriptlet: "echo %1 %2 %3",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		["first", "second", "third"],
		{}
	)
	t.is(formattedScriptlet, "echo first second third")
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet with single curly braces", (t) => {
	const scriptlet = {
		name: "Single Curly Brace Test",
		tool: "bash",
		scriptlet: "echo {not_an_input} {{actual_input}}",
		inputs: ["actual_input"]
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		["hello"],
		{}
	)
	t.is(formattedScriptlet, "echo {not_an_input} hello")
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet with mixed single and double curly braces", (t) => {
	const scriptlet = {
		name: "Mixed Curly Brace Test",
		tool: "bash",
		scriptlet: "echo {ignored} {{input1}} {also_ignored} {{input2}}",
		inputs: ["input1", "input2"]
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		["hello", "world"],
		{}
	)
	t.is(formattedScriptlet, "echo {ignored} hello {also_ignored} world")
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet with single curly brace at end", (t) => {
	const scriptlet = {
		name: "Single Curly Brace End Test",
		tool: "bash",
		scriptlet: "echo {{input}} {",
		inputs: ["input"]
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		["test"],
		{}
	)
	t.is(formattedScriptlet, "echo test {")
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet with single curly brace at start", (t) => {
	const scriptlet = {
		name: "Single Curly Brace Start Test",
		tool: "bash",
		scriptlet: "echo } {{input}}",
		inputs: ["input"]
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		["test"],
		{}
	)
	t.is(formattedScriptlet, "echo } test")
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet with template", (t) => {
	const templateString = "${1|Sincerely,Dearly|}, John"
	const scriptlet = {
		name: "Template Test",
		tool: "template",
		scriptlet: templateString,
		inputs: []
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		[],
		{}
	)
	t.is(formattedScriptlet, templateString)
	t.deepEqual(remainingInputs, [])
})

ava("scriptlet preview", async (t) => {
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

### Quickly Append Text to a .txt File

Type whatever you want!
`

	const scripts = await parseMarkdownAsScriptlets(markdown)
	// t.is(scripts.length, 2)

	const preview1 =`<div class="p-5 prose dark:prose-dark"><h1 id="open-script-kit">Open Script Kit</h1>
<div class="">
  <style>
  p{
    margin-bottom: 1rem;
  }
  li{
    margin-bottom: .25rem;
  }
  
<p>  </style>
  <p class="hljs-tool-topper">bash</p></p>
<!--
Trigger: sk
Alias:
Enabled: Yes
-->

<pre><code class="language-bash">open -a <span class="hljs-string">&#x27;Google Chrome&#x27;</span> https://scriptkit.com/{{user}}
</code></pre><p>This Script Opens the Script Kit URL</p>
<p>I hope you enjoy!</p>

</div></div>`

	const preview2 = `<div class="p-5 prose dark:prose-dark"><h1 id="append-note">Append Note</h1>
<div class="">
  <style>
  p{
    margin-bottom: 1rem;
  }
  li{
    margin-bottom: .25rem;
  }
  
<p>  </style>
  <p class="hljs-tool-topper">kit</p></p>
<pre><code class="language-kit">await appendFile(home(&quot;{{File Name}}.txt&quot;), {{Note}})
</code></pre><h3 id="quickly-append-text-to-a-txt-file">Quickly Append Text to a .txt File</h3>
<p>Type whatever you want!</p>

</div></div>`

	// await writeFile(home("test-1.txt"), scripts[0].preview)
	// await writeFile(home("test-2.txt"), scripts[1].preview)
	t.is(scripts[0].preview, preview1)
	t.is(scripts[1].preview, preview2)
})

ava("formatScriptlet with unsatisfied inputs", (t) => {
	const scriptlet = {
		name: "Unsatisfied Inputs Test",
		tool: "bash",
		scriptlet: "echo {{input1}} {{input2}} {{input3}}",
		inputs: ["input1", "input2", "input3"]
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		["hello"],
		{}
	)
	t.is(formattedScriptlet, "echo hello {{input2}} {{input3}}")
	t.deepEqual(remainingInputs, ["input2", "input3"])
})

ava("formatScriptlet with partially satisfied inputs", (t) => {
	const scriptlet = {
		name: "Partially Satisfied Inputs Test",
		tool: "bash",
		scriptlet: "echo {{input1}} {{input2}} {{input3}} {{input4}}",
		inputs: ["input1", "input2", "input3", "input4"]
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		["hello", "world"],
		{}
	)
	t.is(formattedScriptlet, "echo hello world {{input3}} {{input4}}")
	t.deepEqual(remainingInputs, ["input3", "input4"])
})

ava("formatScriptlet with no provided inputs", (t) => {
	const scriptlet = {
		name: "No Provided Inputs Test",
		tool: "bash",
		scriptlet: "echo {{input1}} {{input2}}",
		inputs: ["input1", "input2"]
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		[],
		{}
	)
	t.is(formattedScriptlet, "echo {{input1}} {{input2}}")
	t.deepEqual(remainingInputs, ["input1", "input2"])
})

ava("formatScriptlet with more inputs than placeholders", (t) => {
	const scriptlet = {
		name: "More Inputs Than Placeholders Test",
		tool: "bash",
		scriptlet: "echo {{input1}} {{input2}}",
		inputs: ["input1", "input2"]
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		["hello", "world", "extra"],
		{}
	)
	t.is(formattedScriptlet, "echo hello world")
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet with inputs and flags, some unsatisfied", (t) => {
	const scriptlet = {
		name: "Inputs and Flags with Unsatisfied Inputs Test",
		tool: "bash",
		scriptlet:
			"echo {{message1}} {{message2}} {{#if uppercase}}| tr '[:lower:]' '[:upper:]'{{/if}}",
		inputs: ["message1", "message2"]
	} as Scriptlet

	const { formattedScriptlet: result1, remainingInputs: remaining1 } =
		formatScriptlet(scriptlet, ["hello"], {})
	t.is(result1, "echo hello {{message2}}")
	t.deepEqual(remaining1, ["message2"])

	const { formattedScriptlet: result2, remainingInputs: remaining2 } =
		formatScriptlet(scriptlet, ["hello"], { uppercase: "true" })
	t.is(result2, "echo hello {{message2}} | tr '[:lower:]' '[:upper:]'")
	t.deepEqual(remaining2, ["message2"])
})

ava("formatScriptlet with else conditional", (t) => {
	const scriptlet = {
		name: "Else Conditional Test",
		tool: "bash",
		scriptlet: "ls {{#if verbose}}-l{{else}}-a{{/if}} ~/Downloads",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet: result1 } = formatScriptlet(scriptlet, [], {
		verbose: "true"
	})
	t.is(result1, "ls -l ~/Downloads")

	const { formattedScriptlet: result2 } = formatScriptlet(scriptlet, [], {})
	t.is(result2, "ls -a ~/Downloads")
})

ava("formatScriptlet with nested conditionals and else", (t) => {
	const scriptlet = {
		name: "Nested Conditional with Else Test",
		tool: "bash",
		scriptlet:
			"ls {{#if all}}-a {{#if long}}-l{{else}}-1{{/if}}{{else}}-F{{/if}} ~/Downloads",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet: result1 } = formatScriptlet(scriptlet, [], {
		all: "true",
		long: "true"
	})
	t.is(result1, "ls -a -l ~/Downloads")

	const { formattedScriptlet: result2 } = formatScriptlet(scriptlet, [], {
		all: "true"
	})
	t.is(result2, "ls -a -1 ~/Downloads")

	const { formattedScriptlet: result3 } = formatScriptlet(scriptlet, [], {})
	t.is(result3, "ls -F ~/Downloads")
})

ava("formatScriptlet with multiple else conditionals", (t) => {
	const scriptlet = {
		name: "Multiple Else Conditionals Test",
		tool: "bash",
		scriptlet:
			"echo {{#if a}}A{{else}}{{#if b}}B{{else}}{{#if c}}C{{else}}D{{/if}}{{/if}}{{/if}}",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet: result1 } = formatScriptlet(scriptlet, [], {
		a: "true"
	})
	t.is(result1, "echo A")

	const { formattedScriptlet: result2 } = formatScriptlet(scriptlet, [], {
		b: "true"
	})
	t.is(result2, "echo B")

	const { formattedScriptlet: result3 } = formatScriptlet(scriptlet, [], {
		c: "true"
	})
	t.is(result3, "echo C")

	const { formattedScriptlet: result4 } = formatScriptlet(scriptlet, [], {})
	t.is(result4, "echo D")
})

ava("formatScriptlet with else conditional and inputs", (t) => {
	const scriptlet = {
		name: "Else Conditional with Inputs Test",
		tool: "bash",
		scriptlet:
			"echo {{#if greet}}Hello, {{name}}!{{else}}Goodbye, {{name}}!{{/if}}",
		inputs: ["name"]
	} as Scriptlet

	const { formattedScriptlet: result1 } = formatScriptlet(scriptlet, ["John"], {
		greet: "true"
	})
	t.is(result1, "echo Hello, John!")

	const { formattedScriptlet: result2 } = formatScriptlet(
		scriptlet,
		["Jane"],
		{}
	)
	t.is(result2, "echo Goodbye, Jane!")
})

ava("formatScriptlet with else if conditional", (t) => {
	const scriptlet = {
		name: "Else If Conditional Test",
		tool: "bash",
		scriptlet: "echo {{#if a}}A{{else if b}}B{{else}}C{{/if}}",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet: result1 } = formatScriptlet(scriptlet, [], {
		a: "true"
	})
	t.is(result1, "echo A")

	const { formattedScriptlet: result2 } = formatScriptlet(scriptlet, [], {
		b: "true"
	})
	t.is(result2, "echo B")

	const { formattedScriptlet: result3 } = formatScriptlet(scriptlet, [], {
		c: "true"
	})
	t.is(result3, "echo C")

	const { formattedScriptlet: result4 } = formatScriptlet(scriptlet, [], {})
	t.is(result4, "echo C")
})

ava("formatScriptlet with else if conditional and inputs", (t) => {
	const scriptlet = {
		name: "Else If Conditional with Inputs Test",
		tool: "bash",
		scriptlet:
			"echo {{#if greet}}Hello, {{name}}!{{else if farewell}}Goodbye, {{name}}!{{else}}Hi, {{name}}!{{/if}}",
		inputs: ["name"]
	} as Scriptlet

	const { formattedScriptlet: result1 } = formatScriptlet(scriptlet, ["John"], {
		greet: "true"
	})
	t.is(result1, "echo Hello, John!")

	const { formattedScriptlet: result2 } = formatScriptlet(scriptlet, ["Jane"], {
		farewell: "true"
	})
	t.is(result2, "echo Goodbye, Jane!")

	const { formattedScriptlet: result3 } = formatScriptlet(
		scriptlet,
		["Alice"],
		{}
	)
	t.is(result3, "echo Hi, Alice!")
})

ava(
	"formatScriptlet with else if conditional and no matching condition",
	(t) => {
		const scriptlet = {
			name: "Else If Conditional No Match Test",
			tool: "bash",
			scriptlet: "echo {{#if a}}A{{else if b}}B{{/if}}",
			inputs: []
		} as Scriptlet

		const { formattedScriptlet: result } = formatScriptlet(scriptlet, [], {
			c: "true"
		})
		t.is(result, "echo")
	}
)

ava("formatScriptlet with two else if conditionals", (t) => {
	const scriptlet = {
		name: "Two Else If Conditionals Test",
		tool: "bash",
		scriptlet: "echo {{#if a}}A{{else if b}}B{{else if c}}C{{else}}D{{/if}}",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet: result1 } = formatScriptlet(scriptlet, [], {
		a: "true"
	})
	t.is(result1, "echo A")

	const { formattedScriptlet: result2 } = formatScriptlet(scriptlet, [], {
		b: "true"
	})
	t.is(result2, "echo B")

	const { formattedScriptlet: result3 } = formatScriptlet(scriptlet, [], {
		c: "true"
	})
	t.is(result3, "echo C")

	const { formattedScriptlet: result4 } = formatScriptlet(scriptlet, [], {
		d: "true"
	})
	t.is(result4, "echo D")

	const { formattedScriptlet: result5 } = formatScriptlet(scriptlet, [], {})
	t.is(result5, "echo D")
})

ava("formatScriptlet with two else if conditionals and inputs", (t) => {
	const scriptlet = {
		name: "Two Else If Conditionals with Inputs Test",
		tool: "bash",
		scriptlet:
			"echo {{#if greet}}Hello, {{name}}!{{else if farewell}}Goodbye, {{name}}!{{else if question}}How are you, {{name}}?{{else}}Hi, {{name}}!{{/if}}",
		inputs: ["name"]
	} as Scriptlet

	const { formattedScriptlet: result1 } = formatScriptlet(scriptlet, ["John"], {
		greet: "true"
	})
	t.is(result1, "echo Hello, John!")

	const { formattedScriptlet: result2 } = formatScriptlet(scriptlet, ["Jane"], {
		farewell: "true"
	})
	t.is(result2, "echo Goodbye, Jane!")

	const { formattedScriptlet: result3 } = formatScriptlet(
		scriptlet,
		["Alice"],
		{
			question: "true"
		}
	)
	t.is(result3, "echo How are you, Alice?")

	const { formattedScriptlet: result4 } = formatScriptlet(
		scriptlet,
		["Bob"],
		{}
	)
	t.is(result4, "echo Hi, Bob!")
})

ava("formatScriptlet - benchmark performance", (t) => {
	const createScriptlet = (index: number): Scriptlet =>
		({
			name: `Test Scriptlet ${index}`,
			tool: "bash",
			scriptlet: 'echo {{input1}} {{input2}} {{#if verbose}}-v{{/if}} {{#if long}}-l{{/if}}',
			inputs: ["input1", "input2"]
		}) as Scriptlet

	const benchmarkFormatScriptlet = () => {
		const iterations = 10000
		const scriptlets = Array.from({ length: 100 }, (_, i) => createScriptlet(i))
		const inputs = ["hello", "world"]
		const flags = { verbose: "true", long: "false" }

		const startTime = process.hrtime.bigint()

		for (let i = 0; i < iterations; i++) {
			const scriptlet = scriptlets[i % scriptlets.length]
			formatScriptlet(scriptlet, inputs, flags)
		}

		const endTime = process.hrtime.bigint()
		const totalTimeNs = Number(endTime - startTime)
		const averageTimeMs = totalTimeNs / iterations / 1e6

		return averageTimeMs
	}

	const averageTime = benchmarkFormatScriptlet()
	t.log(`Average time per formatScriptlet call: ${averageTime.toFixed(3)} ms`)
	t.pass()
})

ava(
	"formatScriptlet replaces numbered variables only before pipe in Unix-style",
	(t) => {
		if (os.platform() === "win32") {
			t.pass("Skipping test on Windows")
			return
		}

		const scriptlet: Scriptlet = {
			name: "Test Unix Pipe",
			tool: "bash",
			scriptlet: "echo $1 $2 | grep $1",
			inputs: []
		} as Scriptlet

		const { formattedScriptlet } = formatScriptlet(scriptlet, [
			"hello",
			"world"
		])
		t.is(formattedScriptlet, "echo hello world | grep $1")
	}
)

ava(
	"formatScriptlet replaces numbered variables only before ampersand in Windows-style",
	(t) => {
		if (os.platform() !== "win32") {
			t.pass("Skipping test on non-Windows platforms")
			return
		}
		const scriptlet: Scriptlet = {
			name: "Test Windows Pipe",
			tool: "cmd",
			scriptlet: "echo %1 %2 & findstr %1",
			inputs: []
		} as Scriptlet

		const { formattedScriptlet } = formatScriptlet(scriptlet, [
			"hello",
			"world"
		])
		if (os.platform() === "win32") {
			t.is(formattedScriptlet, "echo hello world & findstr %1")
		} else {
			t.is(formattedScriptlet, "echo hello world | findstr %1")
		}
	}
)

ava(
	"formatScriptlet handles multiple pipes correctly on non-Windows platforms",
	(t) => {
		if (os.platform() === "win32") {
			t.pass("Skipping test on Windows platforms")
			return
		}
		const scriptlet: Scriptlet = {
			name: "Test Multiple Pipes",
			tool: "bash",
			scriptlet: "echo $1 $2 | grep $3 | sed 's/$4/$5/'",
			inputs: []
		} as Scriptlet

		const { formattedScriptlet } = formatScriptlet(scriptlet, [
			"a",
			"b",
			"c",
			"d",
			"e"
		])
		t.is(formattedScriptlet, "echo a b | grep $3 | sed 's/$4/$5/'")
	}
)

ava("formatScriptlet handles mixed Unix and Windows style variables", (t) => {
	const scriptlet: Scriptlet = {
		name: "Test Mixed Styles",
		tool: "bash",
		scriptlet: "echo $1 %2 | grep ${3} %4",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet } = formatScriptlet(scriptlet, [
		"a",
		"b",
		"c",
		"d"
	])
	if (os.platform() === "win32") {
		// These are positional, so it's grabbing the 2nd and 4th inputs
		t.is(formattedScriptlet, "echo $1 b | grep ${3} d")
	} else {
		t.is(formattedScriptlet, "echo a %2 | grep ${3} %4")
	}
})

ava("formatScriptlet should not treat 'else' as an input", (t) => {
	const scriptlet = {
		name: "Else Not Input Test",
		tool: "bash",
		scriptlet: "echo {{#if a}}A{{else}}B{{/if}} {{input}}",
		inputs: ["input"]
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		["hello"],
		{}
	)
	t.is(formattedScriptlet, "echo B hello")
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet should not treat 'else if' as an input", (t) => {
	const scriptlet = {
		name: "Else If Not Input Test",
		tool: "bash",
		scriptlet: "echo {{#if a}}A{{else if b}}B{{else}}C{{/if}} {{input}}",
		inputs: ["input"]
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		["hello"],
		{}
	)
	t.is(formattedScriptlet, "echo C hello")
	t.deepEqual(remainingInputs, [])
})

ava(
	"formatScriptlet should handle 'else' and inputs with similar names",
	(t) => {
		const scriptlet = {
			name: "Else and Similar Input Test",
			tool: "bash",
			scriptlet: "echo {{elseInput}} {{#if a}}A{{else}}B{{/if}}",
			inputs: ["elseInput"]
		} as Scriptlet

		const { formattedScriptlet, remainingInputs } = formatScriptlet(
			scriptlet,
			["hello"],
			{}
		)
		t.is(formattedScriptlet, "echo hello B")
		t.deepEqual(remainingInputs, [])
	}
)

ava(
	"formatScriptlet should not add 'else' to inputs when in condition",
	(t) => {
		const scriptlet = {
			name: "Else in Condition Test",
			tool: "bash",
			scriptlet: "echo {{#if a}}A{{else}}B{{/if}} {{input}}",
			inputs: ["input"]
		} as Scriptlet

		const { formattedScriptlet, remainingInputs } = formatScriptlet(
			scriptlet,
			["hello"],
			{}
		)
		t.is(formattedScriptlet, "echo B hello")
		t.deepEqual(remainingInputs, [])
	}
)

ava(
	"formatScriptlet should not add 'else' to inputs when in scriptlet",
	(t) => {
		const scriptlet = {
			name: "Else in Scriptlet Test",
			tool: "bash",
			scriptlet: "echo {{input}} else",
			inputs: ["input"]
		} as Scriptlet

		const { formattedScriptlet, remainingInputs } = formatScriptlet(
			scriptlet,
			["hello"],
			{}
		)
		t.is(formattedScriptlet, "echo hello else")
		t.deepEqual(remainingInputs, [])
	}
)

ava(
	"formatScriptlet should not add 'else' to inputs with multiple conditions",
	(t) => {
		const scriptlet = {
			name: "Multiple Conditions Test",
			tool: "bash",
			scriptlet:
				"{{#if a}}A{{else}}B{{/if}} {{#if b}}C{{else}}D{{/if}} {{input}}",
			inputs: ["input"]
		} as Scriptlet

		const { formattedScriptlet, remainingInputs } = formatScriptlet(
			scriptlet,
			["hello"],
			{ b: "true" }
		)
		t.is(formattedScriptlet, "B C hello")
		t.deepEqual(remainingInputs, [])
	}
)

ava("formatScriptlet should handle 'else' in input names correctly", (t) => {
	const scriptlet = {
		name: "Else in Input Name Test",
		tool: "bash",
		scriptlet: "echo {{elseInput}} {{#if a}}A{{else}}B{{/if}}",
		inputs: ["elseInput"]
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		["hello"],
		{}
	)
	t.is(formattedScriptlet, "echo hello B")
	t.deepEqual(remainingInputs, [])
})

ava(
	"formatScriptlet should not add 'else' to inputs with nested conditions",
	(t) => {
		const scriptlet = {
			name: "Nested Conditions Test",
			tool: "bash",
			scriptlet:
				"{{#if a}}A{{#if b}}B{{else}}C{{/if}}{{else}}D{{/if}} {{input}}",
			inputs: ["input"]
		} as Scriptlet

		const { formattedScriptlet, remainingInputs } = formatScriptlet(
			scriptlet,
			["hello"],
			{ a: "true" }
		)
		t.is(formattedScriptlet, "AC hello")
		t.deepEqual(remainingInputs, [])
	}
)

ava("formatScriptlet handles complex du command with awk", (t) => {
	if (os.platform() === "win32") {
		t.pass("Skipping test on Windows")
		return
	}

	const complexCommand =
		"find ~/.kit -type d -exec du -sh {} + | sort -hr | awk '$1 ~ /[0-9]M|[0-9]G/ {print $0}'"

	const scriptlet: Scriptlet = {
		name: "Find Large Directories",
		tool: "bash",
		scriptlet: complexCommand,

		inputs: []
	} as Scriptlet

	const { formattedScriptlet } = formatScriptlet(scriptlet, [])

	t.is(formattedScriptlet, complexCommand)
})

ava("parseMarkdownAsScriptlets handles markdown headers in code fence", async (t) => {
    let markdown = `
## Test Script
\`\`\`bash
# This is a bash comment
## This is another bash comment
echo "Hello World"
\`\`\`
`.trim()

    const scripts = await parseMarkdownAsScriptlets(markdown)
    t.is(scripts.length, 1)
    t.is(scripts[0].name, "Test Script")
    t.is(scripts[0].scriptlet, `# This is a bash comment
## This is another bash comment
echo "Hello World"`)
})

ava("parseMarkdownAsScriptlets handles multiple headers in code fence", async (t) => {
    let markdown = `
## Complex Script
\`\`\`bash
# Main Section
echo "Starting..."

## Subsection A
ls -la

### Sub-subsection
grep "pattern" file.txt

#### Deep nested
cat output.txt
\`\`\`
`.trim()

    const scripts = await parseMarkdownAsScriptlets(markdown)
    t.is(scripts.length, 1)
    t.is(scripts[0].name, "Complex Script")
    t.is(scripts[0].scriptlet, `# Main Section
echo "Starting..."

## Subsection A
ls -la

### Sub-subsection
grep "pattern" file.txt

#### Deep nested
cat output.txt`)
})

ava("parseMarkdownAsScriptlets handles headers with special characters in code fence", async (t) => {
    let markdown = `
## Special Headers Test
\`\`\`bash
# User's Configuration
echo "Config loading..."

## System & Network Setup
ping localhost

### Database >>> Setup
mysql -u root

# !!! Important Warning !!!
echo "Critical section"
\`\`\`
`.trim()

    const scripts = await parseMarkdownAsScriptlets(markdown)
    t.is(scripts.length, 1)
    t.is(scripts[0].name, "Special Headers Test")
    t.is(scripts[0].scriptlet, `# User's Configuration
echo "Config loading..."

## System & Network Setup
ping localhost

### Database >>> Setup
mysql -u root

# !!! Important Warning !!!
echo "Critical section"`)
})

ava("parseMarkdownAsScriptlets with snippet placeholders in template", async (t) => {
  const markdown = `
## Snippet Placeholder Test
\`\`\`template
Dear \${1:name},

Please meet me at \${2:address}

Sincerely,
John
\`\`\`
`.trim()

  const scripts = await parseMarkdownAsScriptlets(markdown)
  t.is(scripts.length, 1)
  t.is(scripts[0].name, "Snippet Placeholder Test")
  t.is(scripts[0].tool, "template")
  t.is(
    scripts[0].scriptlet,
    `Dear \${1:name},

Please meet me at \${2:address}

Sincerely,
John`
  )
  t.deepEqual(scripts[0].inputs, [])
})

ava("formatScriptlet preserves snippet placeholders without treating them as inputs", (t) => {
  const scriptlet = {
    name: "Snippet Preservation Test",
    tool: "template",
    scriptlet: `
Dear \${1:name},

Please meet me at \${2:address}

Sincerely,
John
`.trim(),
    inputs: []
  } as Scriptlet

  // No inputs or flags, just ensure formatting leaves placeholders intact
  const { formattedScriptlet, remainingInputs } = formatScriptlet(scriptlet, [], {})
  t.is(
    formattedScriptlet,
    `Dear \${1:name},

Please meet me at \${2:address}

Sincerely,
John`
  )
  t.deepEqual(remainingInputs, [])
})

ava("parseMarkdownAsScriptlets with mixed snippet placeholders and a {{variable}}", async (t) => {
  const markdown = `
## Mixed Placeholders Test
\`\`\`template
Dear \${1:name},

Please meet me at \${2:address}
Reference Code: {{refCode}}

Sincerely,
John
\`\`\`
`.trim()

  const scripts = await parseMarkdownAsScriptlets(markdown)
  t.is(scripts.length, 1)
  t.is(scripts[0].name, "Mixed Placeholders Test")
  t.is(scripts[0].tool, "template")
  // The snippet placeholders should remain untouched
  t.is(
    scripts[0].scriptlet,
    `Dear \${1:name},

Please meet me at \${2:address}
Reference Code: {{refCode}}

Sincerely,
John`
  )
  // Only `{{refCode}}` is considered an input, snippet placeholders stay as-is
  t.deepEqual(scripts[0].inputs, ["refCode"])
})

ava("H1 with code fence prepends to subsequent H2 scriptlets", async (t) => {
  let markdown = `
# Global Setup
\`\`\`bash
export GLOBAL_VAR="Hello World"
\`\`\`

## Scriptlet One
\`\`\`bash
echo $GLOBAL_VAR from Scriptlet One
\`\`\`

## Scriptlet Two
\`\`\`bash
echo $GLOBAL_VAR from Scriptlet Two
\`\`\`
`.trim()

  const scripts = await parseMarkdownAsScriptlets(markdown)
  t.is(scripts.length, 2)
  t.is(scripts[0].name, "Scriptlet One")
  t.true(scripts[0].scriptlet.startsWith(`export GLOBAL_VAR="Hello World"`))
  t.regex(scripts[0].scriptlet, /echo \$GLOBAL_VAR from Scriptlet One/)

  t.is(scripts[1].name, "Scriptlet Two")
  t.true(scripts[1].scriptlet.startsWith(`export GLOBAL_VAR="Hello World"`))
  t.regex(scripts[1].scriptlet, /echo \$GLOBAL_VAR from Scriptlet Two/)
})

ava("H1 without code fence does not prepend anything", async (t) => {
  let markdown = `
# Global Setup (No code fence)

## Scriptlet One
\`\`\`bash
echo "Scriptlet One"
\`\`\`

## Scriptlet Two
\`\`\`bash
echo "Scriptlet Two"
\`\`\`
`.trim()

  const scripts = await parseMarkdownAsScriptlets(markdown)
  t.is(scripts.length, 2)
  t.is(scripts[0].name, "Scriptlet One")
  t.is(scripts[0].scriptlet, `echo "Scriptlet One"`)
  t.is(scripts[1].name, "Scriptlet Two")
  t.is(scripts[1].scriptlet, `echo "Scriptlet Two"`)
})

ava("No H1 present means no global prepend", async (t) => {
  let markdown = `
## Scriptlet One
\`\`\`bash
echo "Scriptlet One"
\`\`\`

## Scriptlet Two
\`\`\`bash
echo "Scriptlet Two"
\`\`\`
`.trim()

  const scripts = await parseMarkdownAsScriptlets(markdown)
  t.is(scripts.length, 2)
  t.is(scripts[0].scriptlet, `echo "Scriptlet One"`)
  t.is(scripts[1].scriptlet, `echo "Scriptlet Two"`)
})

ava("H1 with empty code fence does nothing", async (t) => {
  let markdown = `
# Global Setup
\`\`\`bash
\`\`\`

## Scriptlet One
\`\`\`bash
echo "Scriptlet One"
\`\`\`
`.trim()

  const scripts = await parseMarkdownAsScriptlets(markdown)
  t.is(scripts.length, 1)
  t.is(scripts[0].scriptlet, `echo "Scriptlet One"`)
})

ava("H1 with complex code fence (multiple lines, conditionals, etc.)", async (t) => {
  let markdown = `
# Global Setup
\`\`\`bash
# This is some global setup
export GLOBAL_VAR="42"
{{#if debug}}echo "Debug mode ON"{{/if}}

\${1|OptionA,OptionB|}
\`\`\`

## Scriptlet One
\`\`\`bash
echo $GLOBAL_VAR from Scriptlet One
\`\`\`

## Scriptlet Two
\`\`\`bash
echo $GLOBAL_VAR from Scriptlet Two
\`\`\`
`.trim()

  const scripts = await parseMarkdownAsScriptlets(markdown)
  t.is(scripts.length, 2)

  // Check scriptlet one
  t.is(scripts[0].name, "Scriptlet One")
  t.true(scripts[0].scriptlet.includes(`# This is some global setup`))
  t.true(scripts[0].scriptlet.includes(`export GLOBAL_VAR="42"`))
  t.true(scripts[0].scriptlet.includes(`{{#if debug}}echo "Debug mode ON"{{/if}}`))
  t.true(scripts[0].scriptlet.includes(`\${1|OptionA,OptionB|}`))
  t.true(scripts[0].scriptlet.includes(`echo $GLOBAL_VAR from Scriptlet One`))

  // Check scriptlet two
  t.is(scripts[1].name, "Scriptlet Two")
  t.true(scripts[1].scriptlet.includes(`# This is some global setup`))
  t.true(scripts[1].scriptlet.includes(`export GLOBAL_VAR="42"`))
  t.true(scripts[1].scriptlet.includes(`{{#if debug}}echo "Debug mode ON"{{/if}}`))
  t.true(scripts[1].scriptlet.includes(`\${1|OptionA,OptionB|}`))
  t.true(scripts[1].scriptlet.includes(`echo $GLOBAL_VAR from Scriptlet Two`))
})

ava("Multiple scriptlets and only one global code fence under the first H1", async (t) => {
  let markdown = `
# Global Setup
\`\`\`bash
export GLOBAL_VAR="Hello"
\`\`\`

## First Scriptlet
\`\`\`bash
echo $GLOBAL_VAR from the first
\`\`\`

## Second Scriptlet
\`\`\`bash
echo $GLOBAL_VAR from the second
\`\`\`

## Third Scriptlet
\`\`\`bash
echo $GLOBAL_VAR from the third
\`\`\`
`.trim()

  const scripts = await parseMarkdownAsScriptlets(markdown)
  t.is(scripts.length, 3)

  for (let s of scripts) {
    t.true(s.scriptlet.includes(`export GLOBAL_VAR="Hello"`), `${s.name} should contain global code`)
  }

  t.regex(scripts[0].scriptlet, /echo \$GLOBAL_VAR from the first/)
  t.regex(scripts[1].scriptlet, /echo \$GLOBAL_VAR from the second/)
  t.regex(scripts[2].scriptlet, /echo \$GLOBAL_VAR from the third/)
})

ava("If a second H1 appears later, its code fence does not override the first", async (t) => {
  let markdown = `
# Global Setup
\`\`\`bash
echo "First Global Code"
\`\`\`

## Scriptlet One
\`\`\`bash
echo "Scriptlet One"
\`\`\`

# Another H1
\`\`\`bash
echo "Second Global Code"
\`\`\`

## Scriptlet Two
\`\`\`bash
echo "Scriptlet Two"
\`\`\`
`.trim()

  const scripts = await parseMarkdownAsScriptlets(markdown)

  // We only apply the first H1 code to all scriptlets below it until maybe another top-level scenario changes that logic.
  // For this feature, we assume only the first encountered H1 code fence is applied globally.
  // If you'd like the second H1 to reset or override global code, that logic would have to be explicitly implemented.

  t.is(scripts.length, 2)

  // The first scriptlet is after the first H1, so it gets "First Global Code".
  t.true(scripts[0].scriptlet.includes(`echo "First Global Code"`))
  t.false(scripts[0].scriptlet.includes(`echo "Second Global Code"`))

  // The second scriptlet comes after the second H1, but per our current logic, we don't re-parse or override.
  // If we wanted multiple H1 sections each with their own global code, we'd need additional logic.
  // For now, assume only the first encountered H1 code fence applies to all scriptlets.
  t.true(scripts[1].scriptlet.includes(`echo "First Global Code"`))
  t.false(scripts[1].scriptlet.includes(`echo "Second Global Code"`))
})
