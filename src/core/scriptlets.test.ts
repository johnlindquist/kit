import ava from "ava"
import type { Scriptlet } from "../types"
import { parseMarkdownAsScriptlets, home, kenvPath } from "./utils"
import { formatScriptlet } from "./scriptlets"

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

ava(
	"parseMarkdownAsScriptlets with conditional flag - ignore else from input",
	async (t) => {
		let markdown = `
## Conditional Flag Test

\`\`\`bash
{{#if flag.cmd}}
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
			`{{#if flag.cmd}}
open https://github.com/time-loop/pr-ai-action-playground
{{else}}
cursor /Users/johnlindquist/dev/github-action-pr
{{/if}}`
		)
		t.deepEqual(scripts[0].inputs, [])
	}
)

ava("formatScriptlet with no flags", (t) => {
	const scriptlet = {
		name: "Test Scriptlet",
		tool: "bash",
		scriptlet:
			"ls {{#if flag.verbose}}-l{{/if}} ~/Downloads {{#if flag.zip}}| grep .zip{{/if}}",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		[],
		{}
	)
	t.is(formattedScriptlet, "ls  ~/Downloads ")
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet with verbose flag", (t) => {
	const scriptlet = {
		name: "Test Scriptlet",
		tool: "bash",
		scriptlet:
			"ls {{#if flag.verbose}}-l{{/if}} ~/Downloads {{#if flag.zip}}| grep .zip{{/if}}",
		inputs: []
	} as Scriptlet

	const { formattedScriptlet, remainingInputs } = formatScriptlet(
		scriptlet,
		[],
		{ verbose: "true" }
	)
	t.is(formattedScriptlet, "ls -l ~/Downloads ")
	t.deepEqual(remainingInputs, [])
})

ava("formatScriptlet with zip flag", (t) => {
	const scriptlet = {
		name: "Test Scriptlet",
		tool: "bash",
		scriptlet:
			"ls {{#if flag.verbose}}-l{{/if}} ~/Downloads {{#if flag.zip}}| grep .zip{{/if}}",
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
			"ls {{#if flag.verbose}}-l{{/if}} ~/Downloads {{#if flag.zip}}| grep .zip{{/if}}",
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
		scriptlet:
			"ls {{#if flag.all}}-a {{#if flag.long}}-l{{/if}}{{/if}} ~/Downloads",
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
			"echo {{message}} {{#if flag.uppercase}}| tr '[:lower:]' '[:upper:]'{{/if}}",
		inputs: ["message"]
	} as Scriptlet

	const { formattedScriptlet: result1, remainingInputs: remaining1 } =
		formatScriptlet(scriptlet, ["hello world"], {})
	t.is(result1, "echo hello world ")
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

	const preview1 = `<div class="p-5 prose dark:prose-dark"><h1 id="open-script-kit"><span>Open Script Kit</span></h1>
<div class="">
  <style>
  p{
    margin-bottom: 1rem;
  }
  li{
    margin-bottom: .25rem;
  }
  
<p><span>  </span></style><span>
  </span><!--
Trigger: sk
Alias:
Enabled: Yes
--></p><pre><code class="hljs language-bash">open -a <span class="hljs-string">&#x27;Google Chrome&#x27;</span> https://scriptkit.com/{{user}}
</code></pre>
<p><span>This Script Opens the Script Kit URL</span></p><p><span>I hope you enjoy!</span></p>
</div></div>`

	const preview2 = `<div class="p-5 prose dark:prose-dark"><h1 id="append-note"><span>Append Note</span></h1>
<div class="">
  <style>
  p{
    margin-bottom: 1rem;
  }
  li{
    margin-bottom: .25rem;
  }
  
<p><span>  </span></style><span>
  </span><pre><code class="hljs language-kit"><span>await appendFile(home(&quot;{{File Name}}.txt&quot;), {{Note}})
</span></code></pre></p><h3 id="quickly-append-text-to-a-txt-file"><span>Quickly Append Text to a .txt File</span></h3>
<p><span>Type whatever you want!</span></p>
</div></div>`

	await writeFile(home("test-1.txt"), scripts[0].preview)
	await writeFile(home("test-2.txt"), scripts[1].preview)
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
			"echo {{message1}} {{message2}} {{#if flag.uppercase}}| tr '[:lower:]' '[:upper:]'{{/if}}",
		inputs: ["message1", "message2"]
	} as Scriptlet

	const { formattedScriptlet: result1, remainingInputs: remaining1 } =
		formatScriptlet(scriptlet, ["hello"], {})
	t.is(result1, "echo hello {{message2}} ")
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
		scriptlet: "ls {{#if flag.verbose}}-l{{else}}-a{{/if}} ~/Downloads",
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
			"ls {{#if flag.all}}-a {{#if flag.long}}-l{{else}}-1{{/if}}{{else}}-F{{/if}} ~/Downloads",
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
			"echo {{#if flag.a}}A{{else}}{{#if flag.b}}B{{else}}{{#if flag.c}}C{{else}}D{{/if}}{{/if}}{{/if}}",
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
			"echo {{#if flag.greet}}Hello, {{name}}!{{else}}Goodbye, {{name}}!{{/if}}",
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
		scriptlet: "echo {{#if flag.a}}A{{else if flag.b}}B{{else}}C{{/if}}",
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
			"echo {{#if flag.greet}}Hello, {{name}}!{{else if flag.farewell}}Goodbye, {{name}}!{{else}}Hi, {{name}}!{{/if}}",
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
			scriptlet: "echo {{#if flag.a}}A{{else if flag.b}}B{{/if}}",
			inputs: []
		} as Scriptlet

		const { formattedScriptlet: result } = formatScriptlet(scriptlet, [], {
			c: "true"
		})
		t.is(result, "echo ")
	}
)

ava("formatScriptlet with two else if conditionals", (t) => {
	const scriptlet = {
		name: "Two Else If Conditionals Test",
		tool: "bash",
		scriptlet:
			"echo {{#if flag.a}}A{{else if flag.b}}B{{else if flag.c}}C{{else}}D{{/if}}",
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
			"echo {{#if flag.greet}}Hello, {{name}}!{{else if flag.farewell}}Goodbye, {{name}}!{{else if flag.question}}How are you, {{name}}?{{else}}Hi, {{name}}!{{/if}}",
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
			scriptlet: `echo {{input1}} {{input2}} {{#if flag.verbose}}-v{{/if}} {{#if flag.long}}-l{{/if}}`,
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

ava("formatScriptlet should not treat 'else' as an input", (t) => {
	const scriptlet = {
		name: "Else Not Input Test",
		tool: "bash",
		scriptlet: "echo {{#if flag.a}}A{{else}}B{{/if}} {{input}}",
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
		scriptlet:
			"echo {{#if flag.a}}A{{else if flag.b}}B{{else}}C{{/if}} {{input}}",
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
			scriptlet: "echo {{elseInput}} {{#if flag.a}}A{{else}}B{{/if}}",
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
			scriptlet: "echo {{#if flag.a}}A{{else}}B{{/if}} {{input}}",
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
				"{{#if flag.a}}A{{else}}B{{/if}} {{#if flag.b}}C{{else}}D{{/if}} {{input}}",
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
		scriptlet: "echo {{elseInput}} {{#if flag.a}}A{{else}}B{{/if}}",
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
				"{{#if flag.a}}A{{#if flag.b}}B{{else}}C{{/if}}{{else}}D{{/if}} {{input}}",
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
