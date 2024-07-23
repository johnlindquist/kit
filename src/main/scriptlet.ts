import { Channel } from "../core/enum.js"
import type { Script, Scriptlet } from "../types"

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

	for (let input of namedInputs) {
		scriptlet = scriptlet.replace(`{${input}}`, inputs.shift())
	}

	send(Channel.STAMP_SCRIPT, focusedScriptlet as Script)
	switch (focusedScriptlet.tool) {
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
			return await exec(insertedArgsScriptlet, {
				shell: true,
				stdio: "inherit"
			})
		}
	}
}
