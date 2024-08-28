import type { Flags, Scriptlet } from "../types"
import slugify from "slugify"
import { readFile } from "node:fs/promises"
import { postprocessMetadata } from "./parser.js"
import { kenvPath } from "./resolvers.js"
import { getKenvFromPath, highlight, tagger } from "./utils.js"
import { SHELL_TOOLS } from "./constants.js"
import { processConditionals } from "./scriptlet.utils.js"

export function formatScriptlet(
	focusedScriptlet: Scriptlet,
	inputs: string[],
	flag?: Flags
): { formattedScriptlet: string; remainingInputs: string[] } {
	let scriptlet = focusedScriptlet?.scriptlet
	if (!scriptlet) {
		throw new Error(`No template found for ${focusedScriptlet.value.name}`)
	}

	scriptlet = processConditionals(scriptlet, flag)

	const namedInputs = focusedScriptlet?.inputs || []
	const remainingInputs = [...namedInputs]

	// Replace numbered inputs first
	for (let i = 0; i < inputs.length; i++) {
		const index = i + 1
		const unixPattern = new RegExp(`\\$\\{?${index}\\}?`, "g")
		const windowsPattern = new RegExp(`%${index}`, "g")
		scriptlet = scriptlet
			.replace(unixPattern, inputs[i])
			.replace(windowsPattern, inputs[i])
	}

	// Then replace named inputs, but only if they haven't been replaced by numbered inputs
	// and are not part of a conditional statement
	const conditionalPattern = /{{#if.*?}}.*?{{\/if}}/gs
	const scriptletWithoutConditionals = scriptlet.replace(conditionalPattern, "")

	for (let i = 0; i < namedInputs.length; i++) {
		const inputName = namedInputs[i]
		if (inputName.toLowerCase() === "else") continue // Skip 'else' as an input name

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

export let parseMarkdownAsScriptlets = async (
	markdown: string
): Promise<Scriptlet[]> => {
	let lines = markdown.trim().split("\n")

	let currentScriptlet: Scriptlet
	let currentMetadata: Metadata
	let scriptlets = [] as Scriptlet[]
	let parsingMetadata = false
	let parsingValue = false

	for (const untrimmedLine of lines) {
		let line = untrimmedLine?.length ? untrimmedLine.trim() : ""

		if (line.startsWith("##") && !line.startsWith("###")) {
			if (currentScriptlet) {
				let metadata = postprocessMetadata(currentMetadata, "")
				scriptlets.push({ ...metadata, ...currentScriptlet })
			}
			let name = line.replace("##", "").trim()
			currentScriptlet = {
				group: "Scriptlets",
				scriptlet: "",
				tool: "",
				name,
				command: slugify(name, { lower: true, trim: true, replacement: "-" }),
				preview: "",
				kenv: ""
			} as Scriptlet

			currentMetadata = {}
			continue
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
			if (!currentScriptlet.tool) {
				let tool = line.replace("```", "").replace("~~~", "").trim()

				if (tool === "") {
					tool = process.platform === "win32" ? "cmd" : "bash"
				}

				currentScriptlet.tool = tool

				// currentScriptlet.preview = `### ${tool}\n${currentScriptlet.preview}`
				parsingValue = true
			} else {
				parsingValue = false
			}
			continue
		}

		if (parsingValue) {
			currentScriptlet.scriptlet =
				`${currentScriptlet.scriptlet}\n${line}`.trim()
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
			currentMetadata[lowerCaseKey] = value
		}
	}

	if (currentScriptlet) {
		let metadata = postprocessMetadata(currentMetadata, "")
		scriptlets.push({ ...metadata, ...currentScriptlet })
	}

	for (let scriptlet of scriptlets) {
		let preview = (scriptlet.preview as string).trim()

		// Check if there are exactly two empty code fences
		const emptyCodeFences = preview.match(/^(```|~~~)\s*$/gm)

		if (emptyCodeFences && emptyCodeFences.length === 2) {
			// Replace only the first occurrence
			preview = preview.replace(/^(```|~~~)\s*$/m, `$1${scriptlet.tool}`)
		}

		let highlightedPreview = md(`# ${scriptlet.name}
${await highlight(preview, "")}`)

		scriptlet.preview = highlightedPreview
		scriptlet.inputs = Array.from(
			new Set(
				scriptlet.scriptlet
					.match(/{{(?!#if|else\s?if|else|\/if)([^}]+)}}/g)
					?.map((x: string) => x.slice(2, -2).trim())
					.filter((x: string) => x !== "" && !x.startsWith("/")) || []
			)
		)

		if (scriptlet.inputs.length === 0 && SHELL_TOOLS.includes(scriptlet.tool)) {
			scriptlet.shebang = scriptlet.tool
		}

		tagger(scriptlet)
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
		scriptlet.group = path.parse(filePathWithoutAnchor).name
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
