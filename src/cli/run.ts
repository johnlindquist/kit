// Description: Run the selected script
import { isScriptlet, isSnippet, run } from "../core/utils.js"
import { runScriptlet } from "../main/scriptlet.js"
import type { Script } from "../types/core.js"

let script = await selectScript("Which script do you want to run?", true)
let runScript = async (script) => {
	if (isScriptlet(script)) {
		console.log("Running scriptlet", script)
		updateArgs(args)
		return await runScriptlet(script, [], flag)
	}
	if (isSnippet(script)) {
		console.log(script.value)
		return
	}
	return await run(script.filePath, ...args)
}
await runScript(script)
