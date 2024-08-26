import { SHELL_TOOLS } from "../core/constants.js"
import { Channel } from "../core/enum.js"
import { kenvPath } from "../core/utils.js"
import type { Flags, Script, Scriptlet } from "../types"
import untildify from "untildify"

export function formatScriptlet(
	focusedScriptlet: Scriptlet,
	inputs: string[],
	flag?: Flags
): { formattedScriptlet: string; remainingInputs: string[] } {
	let scriptlet = focusedScriptlet?.scriptlet
	if (!scriptlet) {
		throw new Error(`No template found for ${focusedScriptlet.value.name}`)
	}

	// Process Handlebars-style conditionals (including nested ones)
	const processConditionals = (str: string): string => {
		return str.replace(
			/{{#if\s+flag\.(\w+)}}((?:(?!{{#if)(?!{{\/if}}).|\n)*?)({{#if\s+flag\.(\w+)}}((?:(?!{{#if)(?!{{\/if}}).|\n)*?){{\/if}}|)((?:(?!{{#if)(?!{{\/if}}).|\n)*?){{\/if}}/g,
			(
				match,
				outerFlag,
				outerContent,
				_,
				innerFlag,
				innerContent,
				remainingOuterContent
			) => {
				if (flag?.[outerFlag]) {
					let result = outerContent
					if (innerFlag && flag?.[innerFlag]) {
						result += innerContent
					}
					result += remainingOuterContent
					return result.trim()
				}
				return ""
			}
		)
	}

	scriptlet = processConditionals(scriptlet)

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
	for (let i = 0; i < namedInputs.length; i++) {
		const inputPattern = new RegExp(`{{${namedInputs[i]}}}`, "g")
		if (scriptlet.match(inputPattern) && inputs[i] !== undefined) {
			scriptlet = scriptlet.replace(inputPattern, inputs[i])
			remainingInputs.splice(remainingInputs.indexOf(namedInputs[i]), 1)
		}
	}

	// Replace $@ with all arguments, each surrounded by quotes
	scriptlet = scriptlet.replace(
		/\$@|%\*/g,
		inputs.map((arg) => `"${arg}"`).join(" ")
	)

	return { formattedScriptlet: scriptlet, remainingInputs }
}

const toolExtensionMap = new Map([
	["ruby", "rb"],
	["python", "py"],
	["perl", "pl"],
	["php", "php"],
	["node", "js"],
	["bash", "sh"],
	["powershell", "ps1"],
	["lua", "lua"],
	["r", "r"],
	["groovy", "groovy"],
	["scala", "scala"],
	["swift", "swift"],
	["go", "go"],
	["rust", "rs"],
	["java", "java"],
	["clojure", "clj"],
	["elixir", "ex"],
	["erlang", "erl"],
	["ocaml", "ml"]
])

const toolCommandMap = new Map([
	["ruby", (scriptPath) => `ruby ${scriptPath}`],
	["python", (scriptPath) => `python ${scriptPath}`],
	["perl", (scriptPath) => `perl ${scriptPath}`],
	["php", (scriptPath) => `php ${scriptPath}`],
	["node", (scriptPath) => `node ${scriptPath}`],
	["bash", (scriptPath) => `bash ${scriptPath}`],
	["powershell", (scriptPath) => `powershell -File ${scriptPath}`],
	["lua", (scriptPath) => `lua ${scriptPath}`],
	["r", (scriptPath) => `Rscript ${scriptPath}`],
	["groovy", (scriptPath) => `groovy ${scriptPath}`],
	["scala", (scriptPath) => `scala ${scriptPath}`],
	["swift", (scriptPath) => `swift ${scriptPath}`],
	["go", (scriptPath) => `go run ${scriptPath}`],
	[
		"rust",
		(scriptPath) =>
			`rustc ${scriptPath} -o ${scriptPath}.exe && ${scriptPath}.exe`
	],
	["java", (scriptPath) => `java ${scriptPath}`],
	["clojure", (scriptPath) => `clojure ${scriptPath}`],
	["elixir", (scriptPath) => `elixir ${scriptPath}`],
	["erlang", (scriptPath) => `escript ${scriptPath}`],
	["ocaml", (scriptPath) => `ocaml ${scriptPath}`]
])

export let runScriptlet = async (
	focusedScriptlet: Scriptlet,
	inputs: string[],
	flag?: Flags
) => {
	if (!focusedScriptlet.tool) {
		throw new Error(`No tool found for ${focusedScriptlet.value.name}`)
	}

	let { formattedScriptlet, remainingInputs } = formatScriptlet(
		focusedScriptlet,
		inputs,
		flag
	)

	const unixPattern = /\$\{?(\d+)\}?/g
	const windowsPattern = /%(\d+)/g

	const matches =
		formattedScriptlet.match(unixPattern) ||
		formattedScriptlet.match(windowsPattern)

	const matchesSet = new Set(matches || [])
	const needs: string[] = [...(matches || []), ...remainingInputs]

	for (let need of needs) {
		let result = await arg(need)
		if (matchesSet.has(need)) {
			// For matches (Unix/Windows patterns), replace directly
			formattedScriptlet = formattedScriptlet.replace(need, result)
		} else {
			// For inputs, wrap in curly braces before replacing
			formattedScriptlet = formattedScriptlet.replaceAll(`{{${need}}}`, result)
		}
	}

	if (process.env.KIT_CONTEXT === "app") {
		send(Channel.STAMP_SCRIPT, focusedScriptlet as Script)
	}

	switch (focusedScriptlet.tool) {
		case "kit":
		case "ts":
		case "js": {
			const quickPath = kenvPath(
				"tmp",
				`scriptlet-${focusedScriptlet.command}.ts`
			)
			await writeFile(quickPath, formattedScriptlet)
			return await run(quickPath)
		}
		case "transform": {
			const quickPath = kenvPath(
				"tmp",
				`scriptlet-${focusedScriptlet.command}.ts`
			)
			const content = `let text = await getSelectedText()
let result = ${formattedScriptlet}
await setSelectedText(result)`
			await writeFile(quickPath, content)
			return await run(quickPath)
		}
		case "open":
		case "edit":
		case "paste":
		case "type":
			await hide()
			if (focusedScriptlet.tool === "open") {
				await open(formattedScriptlet)
				await wait(1000)
			} else if (focusedScriptlet.tool === "edit") {
				await edit(formattedScriptlet)
				await wait(1000)
			} else if (focusedScriptlet.tool === "paste") {
				await setSelectedText(formattedScriptlet)
			} else if (focusedScriptlet.tool === "type") {
				await keyboard.type(formattedScriptlet)
			}
			process.exit(0)
			break
		default: {
			const extension =
				toolExtensionMap.get(focusedScriptlet.tool) || focusedScriptlet.tool
			const scriptPath = kenvPath(
				"tmp",
				`scriptlet-${focusedScriptlet.command}.${extension}`
			)
			await writeFile(scriptPath, formattedScriptlet)

			const commandGenerator = toolCommandMap.get(focusedScriptlet.tool)
			if (!commandGenerator) {
				throw new Error(`Unsupported tool: ${focusedScriptlet.tool}`)
			}

			let command = commandGenerator(scriptPath)

			if (focusedScriptlet.prepend) {
				command = `${focusedScriptlet.prepend} ${command}`
			}

			if (focusedScriptlet.append) {
				command = `${command} ${focusedScriptlet.append}`
			}

			const cwd = focusedScriptlet?.cwd
				? untildify(focusedScriptlet.cwd)
				: undefined

			const useExec =
				SHELL_TOOLS.includes(focusedScriptlet.tool) && !focusedScriptlet.term

			if (process.env.KIT_CONTEXT === "app") {
				if (!useExec) {
					return await term({ command, cwd })
				}

				if (focusedScriptlet.shebang) {
					return await sendWait(Channel.SHEBANG, focusedScriptlet as Script)
				}
			}

			return await exec(command, {
				shell: true,
				stdio: "inherit",
				cwd,
				windowsHide: true
			})
		}
	}
}
