import type { Flags } from "../types"

export function processConditionals(str: string, flag?: Flags): string {
	const regex =
		/{{#if\s+([\w-]+)}}((?:(?!{{#if)(?!{{\/if}}).|\n)*?)((?:{{else\s+if\s+([\w-]+)}}((?:(?!{{#if)(?!{{\/if}}).|\n)*?))*)(?:{{else}}((?:(?!{{#if)(?!{{\/if}}).|\n)*?))?{{\/if}}/g

	let result = str
	let lastResult: string

	do {
		lastResult = result

		result = result.replace(
			regex,
			(match, condition, ifContent, elseIfBlock, ...args) => {
				if (flag?.[condition]) {
					return ifContent
				}

				// Process else-if conditions
				const elseIfRegex =
					/{{else\s+if\s+([\w-]+)\s*}}((?:(?!{{else\s+if)(?!{{else}})(?!{{\/if}}).|\n)*)/g
				let elseIfMatch: RegExpExecArray | null
				while (true) {
					elseIfMatch = elseIfRegex.exec(elseIfBlock)
					if (elseIfMatch === null) break
					const [, elseIfCondition, elseIfContent] = elseIfMatch
					if (flag?.[elseIfCondition]) {
						return elseIfContent
					}
				}

				// Handle else content
				const elseContent = args[args.length - 3]

				return elseContent || ""
			}
		)
	} while (result !== lastResult)

	// Normalize whitespace: collapse multiple spaces into single space on each line
	// This handles artifacts from conditional removal (e.g., "ls -a  ~/Downloads" -> "ls -a ~/Downloads")
	result = result
		.split('\n')
		.map(line => line.replace(/ {2,}/g, ' '))
		.join('\n')

	return result
}
