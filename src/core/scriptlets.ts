import type { Scriptlet } from "../types"
import slugify from "slugify"
import { postprocessMetadata } from "./parser.js"
import { getKenvFromPath, highlight, tagger } from "./utils.js"

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
				let tool = line.replace("```", "").replace("~~~", "").trim() || "ts"
				currentScriptlet.tool = tool

				currentScriptlet.preview += `\n// ${tool}`
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

		let highlightedPreview = md(`# ${scriptlet.name}
${await highlight(preview, "")}`)

		scriptlet.preview = highlightedPreview
		scriptlet.inputs = Array.from(
			new Set(
				scriptlet.scriptlet
					.match(/(?<!import |export |\$|`\${|=\s*){[a-zA-Z0-9 ]*?}/g)
					?.map((x: string) => x.slice(1, -1)) || []
			)
		)
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
