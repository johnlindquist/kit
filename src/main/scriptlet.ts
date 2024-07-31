import { Channel } from "../core/enum.js"
import type { Script, Scriptlet } from "../types"
import untildify from "untildify"

export let runScriptlet = async (
	focusedScriptlet: Scriptlet,
	inputs: string[]
) => {
	if (!focusedScriptlet.tool) {
		return await div(
			md(`# No tool found for ${focusedScriptlet.value.name}
  
  ~~~json
  ${JSON.stringify(focusedScriptlet, null, 2)}
  ~~~
  `)
		)
	}

	let scriptlet = focusedScriptlet?.scriptlet
	if (!scriptlet) {
		return await div(
			md(`# No template found for ${focusedScriptlet.value.name}
  ~~~json      
  ${JSON.stringify(focusedScriptlet, null, 2)}
  ~~~
  `)
		)
	}

	const namedInputs = focusedScriptlet?.inputs

	if (process.env.KIT_CONTEXT === "terminal") {
		for (let input of namedInputs) {
			let value = await arg(input)
			scriptlet = scriptlet.replaceAll(`{${input}}`, value)
		}
	} else {
		for (let input of namedInputs) {
			scriptlet = scriptlet.replaceAll(`{${input}}`, inputs.shift())
		}
	}

	send(Channel.STAMP_SCRIPT, focusedScriptlet as Script)
	switch (focusedScriptlet.tool) {
		case "":
		case "kit":
		case "ts":
		case "js": {
			let quickPath = kenvPath(
				"tmp",
				`scriptlet-${focusedScriptlet.command}.ts`
			)
			await writeFile(quickPath, scriptlet)
			return await run(quickPath)
		}
		case "transform": {
			let quickPath = kenvPath(
				"tmp",
				`scriptlet-${focusedScriptlet.command}.ts`
			)

			let content = `let text = await getSelectedText()
let result = ${scriptlet}
await setSelectedText(result)`
			await writeFile(quickPath, content)
			return await run(quickPath)
		}
		case "open":
			return await open(scriptlet)
		case "edit":
			return await edit(scriptlet)
		case "paste":
			return await setSelectedText(scriptlet)
		case "type":
			await hide()
			return await keyboard.type(scriptlet)
		default: {
			let insertedArgsScriptlet = scriptlet
			// Replace $@ with all arguments, each surrounded by quotes
			insertedArgsScriptlet = insertedArgsScriptlet.replace(
				/\$@|%\*/g,
				inputs.map((arg) => `"${arg}"`).join(" ")
			)
			// Replace all the $1, $2, etc with the quoted values from the inputs array
			for (let i = 0; i < inputs.length; i++) {
				const index = i + 1
				const unixPattern = new RegExp(`\\$\\{?${index}\\}?`, "g")
				const windowsPattern = new RegExp(`%${index}`, "g")
				const replacement = inputs[i]
				insertedArgsScriptlet = insertedArgsScriptlet
					.replace(unixPattern, replacement)
					.replace(windowsPattern, replacement)
			}

			const getExtension = (tool) => {
				const extensionMap = {
					ruby: "rb",
					python: "py",
					perl: "pl",
					php: "php",
					node: "js",
					bash: "sh",
					powershell: "ps1",
					lua: "lua",
					r: "r",
					groovy: "groovy",
					scala: "scala",
					swift: "swift",
					go: "go",
					rust: "rs",
					java: "java",
					clojure: "clj",
					elixir: "ex",
					erlang: "erl",
					ocaml: "ml"
				}
				return extensionMap[tool] || tool
			}

			if (getExtension(focusedScriptlet.tool) !== focusedScriptlet.tool) {
				const extension = getExtension(focusedScriptlet.tool)
				const scriptPath = kenvPath(
					"tmp",
					`scriptlet-${focusedScriptlet.command}.${extension}`
				)
				await writeFile(scriptPath, insertedArgsScriptlet)

				let command: string
				switch (focusedScriptlet.tool) {
					case "ruby":
						command = `ruby ${scriptPath}`
						break
					case "python":
						command = `python ${scriptPath}`
						break
					case "perl":
						command = `perl ${scriptPath}`
						break
					case "php":
						command = `php ${scriptPath}`
						break
					case "node":
						command = `node ${scriptPath}`
						break
					case "bash":
						command = `bash ${scriptPath}`
						break
					case "powershell":
						command = `powershell -File ${scriptPath}`
						break
					case "lua":
						command = `lua ${scriptPath}`
						break
					case "r":
						command = `Rscript ${scriptPath}`
						break
					case "groovy":
						command = `groovy ${scriptPath}`
						break
					case "scala":
						command = `scala ${scriptPath}`
						break
					case "swift":
						command = `swift ${scriptPath}`
						break
					case "go":
						command = `go run ${scriptPath}`
						break
					case "rust":
						command = `rustc ${scriptPath} -o ${scriptPath}.exe && ${scriptPath}.exe`
						break
					case "java":
						command = `java ${scriptPath}`
						break
					case "clojure":
						command = `clojure ${scriptPath}`
						break
					case "elixir":
						command = `elixir ${scriptPath}`
						break
					case "erlang":
						command = `escript ${scriptPath}`
						break
					case "ocaml":
						command = `ocaml ${scriptPath}`
						break
				}

				if (focusedScriptlet.prepend) {
					command = `${focusedScriptlet.prepend} ${command}`
				}

				if (focusedScriptlet.append) {
					command = `${command} ${focusedScriptlet.append}`
				}

				let cwd = focusedScriptlet?.cwd
					? untildify(focusedScriptlet.cwd)
					: undefined

				let useExec = () => {
					const shellTools = [
						"bash",
						"sh",
						"zsh",
						"fish",
						"powershell",
						"pwsh",
						"cmd"
					]
					return (
						shellTools.includes(focusedScriptlet.tool) && !focusedScriptlet.term
					)
				}

				if (process.env.KIT_CONTEXT === "app" && !useExec()) {
					return await term({
						command,
						cwd
					})
				}

				return await exec(command, {
					shell: true,
					stdio: "inherit",
					cwd,
					windowsHide: true
				})
			}

			throw new Error(`Unsupported tool: ${focusedScriptlet.tool}`)
		}
	}
}
