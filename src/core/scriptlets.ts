import type { Flags, Scriptlet } from "../types"
import slugify from "slugify"
import { readFile } from "node:fs/promises"
import { postprocessMetadata } from "./parser.js"
import { kenvPath } from "./resolvers.js"
import { getKenvFromPath, highlight, stripName, tagger } from "./utils.js"
import { SHELL_TOOLS } from "./constants.js"
import { processConditionals } from "./scriptlet.utils.js"
import os from "node:os"

export function formatScriptlet(
	focusedScriptlet: Scriptlet,
	inputs: string[],
	flag?: Flags
): { formattedScriptlet: string; remainingInputs: string[] } {
	let scriptlet = focusedScriptlet?.scriptlet
	if (!scriptlet) {
		throw new Error(`No template found for ${focusedScriptlet.value.name}`)
	}

	scriptlet = processConditionals(scriptlet, flag).trim()

	const namedInputs = focusedScriptlet?.inputs || []
	const remainingInputs = [...namedInputs]

	const pipeSymbol = os.platform() === "win32" ? "&" : "|"
	const parts = scriptlet.split(new RegExp(`\\${pipeSymbol}`))
	const variableSymbol = os.platform() === "win32" ? "%" : "$"
	parts[0] = parts[0].replace(
		new RegExp(`\\${variableSymbol}(\\d+)`, "g"),
		(match, unixNum, winNum) => {
			const index = Number.parseInt(unixNum || winNum) - 1
			return inputs[index] !== undefined ? inputs[index] : match
		}
	)
	scriptlet = parts.join(pipeSymbol)

	// Then replace named inputs, but only if they haven't been replaced by numbered inputs
	// and are not part of a conditional statement
	const conditionalPattern = /{{#if.*?}}.*?{{\/if}}/gs
	const scriptletWithoutConditionals = scriptlet.replace(conditionalPattern, "")

	for (let i = 0; i < namedInputs.length; i++) {
		const inputName = namedInputs[i]
		if (inputName.toLowerCase() === "else") {
			continue // Skip 'else' as an input name
		}

		const inputPattern = new RegExp(`{{${inputName}}}`, "g")
		if (
			scriptletWithoutConditionals.match(inputPattern) &&
			inputs[i] !== undefined
		) {
			scriptlet = scriptlet.replace(inputPattern, inputs[i])
			remainingInputs.splice(remainingInputs.indexOf(inputName), 1)
		}
	}

	// Replace $@ with all arguments, each surrounded by quotes
	scriptlet = scriptlet.replace(
		/\$@|%\*/g,
		inputs.map((arg) => `"${arg}"`).join(" ")
	)

	return { formattedScriptlet: scriptlet, remainingInputs }
}

const h1Regex = /^#(?!#)/
const h2Regex = /^##(?!#)/
const toolRegex = /^(```|~~~)\s*$/m
const emptyCodeFenceRegex = /^(```|~~~)\s*$/gm
const ifElseRegex = /{{(?!#if|else\s?if|else|\/if)([^}]+)}}/g

export let parseMarkdownAsScriptlets = async (
	markdown: string
): Promise<Scriptlet[]> => {
	let lines = markdown.trim().split("\n")

	let markdownMetadata: Metadata = {
		exclude: true
	}
	let parsingMarkdownMetadata = false

	let currentGroup = "Scriptlets"
	let currentScriptlet: Scriptlet
	let currentMetadata: Metadata
	let scriptlets = [] as Scriptlet[]
	let parsingMetadata = false
	let parsingValue = false

	let insideCodeFence = false

	for (const untrimmedLine of lines) {
		let line = untrimmedLine?.length > 0 ? untrimmedLine.trim() : ""

		if (line.startsWith("```") || line.startsWith("~~~")) {
			insideCodeFence = !insideCodeFence
		}

		if (!insideCodeFence) {
			// Check for H1 and set as current group
			if (line.match(h1Regex)) {
				currentGroup = line.replace(h1Regex, "").trim()
				parsingMarkdownMetadata = true
				continue
			}

			if (line.match(h2Regex)) {
				parsingMarkdownMetadata = false
				if (currentScriptlet) {
					let metadata = postprocessMetadata(currentMetadata, "")
					scriptlets.push({ ...metadata, ...currentScriptlet })
				}
				let name = line.replace(h2Regex, "").trim()
				currentScriptlet = {
					group: currentGroup,
					scriptlet: "",
					tool: "",
					name,
					command: stripName(name),
					preview: "",
					kenv: ""
				} as Scriptlet

				currentMetadata = {}
				continue
			}
		}

		if (currentScriptlet) {
			currentScriptlet.preview += `\n${line}`
		}
		if (line.startsWith("<!--")) {
			parsingMetadata = true
			continue
		}
		if (parsingMetadata && line.includes("-->")) {
			parsingMetadata = false
			continue
		}

		if (line.startsWith("```") || line.startsWith("~~~")) {
			if (currentScriptlet.tool) {
				parsingValue = false
			} else {
				let tool = line.replace("```", "").replace("~~~", "").trim()

				if (tool === "") {
					tool = process.platform === "win32" ? "cmd" : "bash"
				}

				currentScriptlet.tool = tool

				const toolHTML = `

<p class="hljs-tool-topper">${tool}</p>

`.trim()
				currentScriptlet.preview = `${toolHTML}\n${currentScriptlet.preview}`
				parsingValue = true
			}
			continue
		}

		if (parsingValue) {
			currentScriptlet.scriptlet = currentScriptlet.scriptlet 
				? `${currentScriptlet.scriptlet}\n${line}`
				: line
		}

		if (parsingMetadata) {
			let indexOfColon = line.indexOf(":")
			if (indexOfColon === -1) {
				continue
			}
			let key = line.slice(0, indexOfColon).trim()
			let value = line.slice(indexOfColon + 1).trim()
			let lowerCaseKey = key.toLowerCase()
			let ignore = ["background", "schedule", "watch", "system"].includes(
				lowerCaseKey
			)
			if (ignore) {
				continue
			}
			if (parsingMarkdownMetadata) {
				markdownMetadata[lowerCaseKey] = value
			} else {
				currentMetadata[lowerCaseKey] = value
			}
		}
	}

	if (currentScriptlet) {
		let metadata = postprocessMetadata(currentMetadata, "")
		currentScriptlet.scriptlet = currentScriptlet.scriptlet.trim()
		scriptlets.push({ ...metadata, ...currentScriptlet })
	}

	for (let scriptlet of scriptlets) {
		let preview = (scriptlet.preview as string).trim()

		// Check if there are exactly two empty code fences
		const emptyCodeFences = preview.match(emptyCodeFenceRegex)

		if (emptyCodeFences && emptyCodeFences.length === 2) {
			// Replace only the first occurrence
			preview = preview.replace(toolRegex, `$1${scriptlet.tool}`)
		}

		let highlightedPreview = md(`# ${scriptlet.name}
${await highlight(preview, "")}`)

		scriptlet.preview = highlightedPreview
		scriptlet.inputs = Array.from(
			new Set(
				scriptlet.scriptlet
					.match(ifElseRegex)
					?.map((x: string) => x.slice(2, -2).trim())
					.filter((x: string) => x !== "" && !x.startsWith("/")) || []
			)
		)

		if (scriptlet.inputs.length === 0 && SHELL_TOOLS.includes(scriptlet.tool)) {
			scriptlet.shebang = scriptlet.tool
		}

		tagger(scriptlet)
	}

	const metadataKeys = Object.keys(markdownMetadata)
	if (metadataKeys.length > 1) {
		let metadata = postprocessMetadata(markdownMetadata, "")
		scriptlets.unshift({
			...metadata,
			name: currentGroup,
			command: stripName(currentGroup),
			group: metadata.exclude ? undefined : currentGroup,
			tool: "kit",
			// TODO: Extract to a file
			scriptlet: `
const scripts = await getScripts(true);
let focused;
const script = await arg(
  {
    placeholder: "Select a Scriptlet",
    onChoiceFocus: (input, state) => {
      focused = state.focused;
    },
  },
  scripts.filter((s) => s.group === "${currentGroup}")
);

const { runScriptlet } = await import(kitPath("main", "scriptlet.js"));

export let isScriptlet = (
  script: Script | Scriptlet
): script is Scriptlet => {
  return "scriptlet" in script
}

export let isSnippet = (
  script: Script
): script is Snippet => {
  return "text" in script
}

const determineScriptletRun = async () => {
	if (isSnippet(script)) {
		send("STAMP_SCRIPT", script as Script)

		return await run(
		kitPath("app", "paste-snippet.js"),
		"--filePath",
		script.filePath
		)
	}
    if (isScriptlet(script)) {
        await runScriptlet(script, script.inputs || [], flag)
        return
      }
    
      if (Array.isArray(script)) {
        await runScriptlet(focused as Scriptlet, script, flag)
        return
      }
    
      if ((script as Script)?.shebang) {
        const shebang = parseShebang(script as Script)
        return await sendWait(Channel.SHEBANG, shebang)
      }
}


await determineScriptletRun();
			`,
			preview: `
List all the scriptlets in the ${currentGroup} group
			`,
			inputs: []
		} as Scriptlet)
	}

	return scriptlets
}

export let parseScriptletsFromPath = async (
	filePath: string
): Promise<Scriptlet[]> => {
	let filePathWithoutAnchor = filePath.split("#")[0]
	let allScriptlets: Scriptlet[] = []
	let fileContents = await readFile(filePathWithoutAnchor, "utf8")
	let scriptlets = await parseMarkdownAsScriptlets(fileContents)
	for (let scriptlet of scriptlets) {
		// scriptlet.group = path.parse(filePathWithoutAnchor).name
		scriptlet.filePath = `${filePathWithoutAnchor}#${slugify(scriptlet.name)}`
		scriptlet.kenv = getKenvFromPath(filePathWithoutAnchor)
		scriptlet.value = Object.assign({}, scriptlet)
		allScriptlets.push(scriptlet)
	}

	return allScriptlets
}

export let parseScriptlets = async (): Promise<Scriptlet[]> => {
	let scriptletsPaths = await globby(
		kenvPath("scriptlets", "*.md").replace(/\\/g, "/")
	)
	let nestedScriptletPaths = await globby(
		kenvPath("kenvs", "*", "scriptlets", "*.md").replace(/\\/g, "/")
	)

	let allScriptletsPaths = scriptletsPaths.concat(nestedScriptletPaths)

	let allScriptlets: Scriptlet[] = []
	for (let scriptletsPath of allScriptletsPaths) {
		let fileContents = await readFile(scriptletsPath, "utf8")
		let scriptlets = await parseMarkdownAsScriptlets(fileContents)
		for (let scriptlet of scriptlets) {
			scriptlet.filePath = `${scriptletsPath}#${slugify(scriptlet.name)}`
			scriptlet.kenv = getKenvFromPath(scriptletsPath)
			scriptlet.value = Object.assign({}, scriptlet)
			allScriptlets.push(scriptlet)
		}
	}

	return allScriptlets
}
