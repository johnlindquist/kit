export function processConditionals(
	str: string,
	flag?: Record<string, string>
): string {
	const regex =
		/{{#if\s+flag\.([\w-]+)}}((?:(?!{{#if)(?!{{\/if}}).|\n)*?)((?:{{else\s+if\s+flag\.([\w-]+)}}((?:(?!{{#if)(?!{{\/if}}).|\n)*?))*)(?:{{else}}((?:(?!{{#if)(?!{{\/if}}).|\n)*?))?{{\/if}}/g

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
					/{{else\s+if\s+flag\.([\w-]+)\s*}}((?:(?!{{else\s+if)(?!{{else}})(?!{{\/if}}).|\n)*)/g
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

	return result
}
