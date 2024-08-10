import type { Snippet } from "../types"
import { kenvPath } from "./resolvers.js"
import { escapeHTML, getKenvFromPath } from "./utils.js"

export let parseSnippets = async (): Promise<Snippet[]> => {
	let snippetPaths = await globby([
		kenvPath("snippets", "**", "*.txt").replaceAll("\\", "/"),
		kenvPath("kenvs", "*", "snippets", "**", "*.txt").replaceAll("\\", "/")
	])

	let snippetChoices = []
	for await (let s of snippetPaths) {
		let contents = await readFile(s, "utf8")
		let { metadata, snippet } = getSnippet(contents)
		let formattedSnippet = escapeHTML(snippet)

		snippetChoices.push({
			filePath: s,
			name: metadata?.name || s,
			tag: metadata?.snippet || "",
			description: s,
			text: snippet.trim(),
			preview: `<div class="p-4">${formattedSnippet}</div>`,
			group: "Snippets",
			kenv: getKenvFromPath(s),
			value: snippet.trim()
		})
	}

	return snippetChoices
}

export let getSnippet = (
	contents: string
): {
	metadata: Record<string, string>
	snippet: string
} => {
	let lines = contents.split("\n")
	let metadata = {}
	let contentStartIndex = lines.length

	for (let i = 0; i < lines.length; i++) {
		let line = lines[i]
		let match = line.match(/(?<=^(?:(?:\/\/)|#)\s{0,2})([\w-]+)(?::)(.*)/)

		if (match) {
			let [, key, value] = match
			if (value) {
				metadata[key.trim().toLowerCase()] = value.trim()
			}
		} else {
			contentStartIndex = i
			break
		}
	}
	let snippet = lines.slice(contentStartIndex).join("\n")
	return { metadata, snippet }
}
