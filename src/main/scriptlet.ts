import { SHELL_TOOLS } from "../core/constants.js"
import { Channel } from "../core/enum.js"
import { formatScriptlet } from "../core/scriptlets.js"
import { parseShebang } from "../core/shebang.js"
import { kenvPath } from "../core/utils.js"
import type { Flags, Script, Scriptlet } from "../types"
import untildify from "untildify"

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

	const formattedFocusedScriptlet = structuredClone(focusedScriptlet)
	formattedFocusedScriptlet.scriptlet = formattedScriptlet

	switch (formattedFocusedScriptlet.tool) {
		case "kit":
		case "ts":
		case "js": {
			const quickPath = kenvPath(
				"tmp",
				`scriptlet-${formattedFocusedScriptlet.command}.ts`
			)
			await writeFile(quickPath, formattedScriptlet)
			return await run(quickPath)
		}
		case "transform": {
			const quickPath = kenvPath(
				"tmp",
				`scriptlet-${formattedFocusedScriptlet.command}.ts`
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
			if (formattedFocusedScriptlet.tool === "open") {
				await open(formattedScriptlet)
				await wait(1000)
			} else if (formattedFocusedScriptlet.tool === "edit") {
				await edit(formattedScriptlet)
				await wait(1000)
			} else if (formattedFocusedScriptlet.tool === "paste") {
				await setSelectedText(formattedScriptlet)
			} else if (formattedFocusedScriptlet.tool === "type") {
				await keyboard.type(formattedScriptlet)
			}
			process.exit(0)
			break
		default: {
			const extension =
				toolExtensionMap.get(formattedFocusedScriptlet.tool) ||
				formattedFocusedScriptlet.tool
			const scriptPath = kenvPath(
				"tmp",
				`scriptlet-${formattedFocusedScriptlet.command}.${extension}`
			)
			await writeFile(scriptPath, formattedScriptlet)

			const commandGenerator = toolCommandMap.get(
				formattedFocusedScriptlet.tool
			)
			if (!commandGenerator) {
				throw new Error(`Unsupported tool: ${formattedFocusedScriptlet.tool}`)
			}

			let command = commandGenerator(scriptPath)

			if (formattedFocusedScriptlet.prepend) {
				command = `${formattedFocusedScriptlet.prepend} ${command}`
			}

			if (formattedFocusedScriptlet.append) {
				command = `${command} ${formattedFocusedScriptlet.append}`
			}

			const cwd = formattedFocusedScriptlet?.cwd
				? untildify(formattedFocusedScriptlet.cwd)
				: undefined

			const useExec =
				SHELL_TOOLS.includes(formattedFocusedScriptlet.tool) &&
				!formattedFocusedScriptlet.term

			if (process.env.KIT_CONTEXT === "app") {
				if (!useExec) {
					return await term({ command, cwd })
				}

				if (formattedFocusedScriptlet.shebang) {
					const shebang = parseShebang(formattedFocusedScriptlet)
					return await sendWait(Channel.SHEBANG, shebang)
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
