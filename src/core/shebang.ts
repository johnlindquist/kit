import type { Script, Scriptlet } from "../types"
import untildify from "untildify"
import { kenvPath } from "./utils.js"

export type ShebangConfig = {
	command: string
	args: string[]
	shell: boolean | string
	cwd: string
	filePath: string
}
export function parseShebang(script: Script | Scriptlet): ShebangConfig {
	let command = ""
	let args: string[] = []
	let shell: boolean | string = true
	let cwd = kenvPath()
	let filePath = script.filePath

	if ("scriptlet" in script) {
		;[command, ...args] = script.scriptlet.split(" ")
		if (script?.shell === false || script?.shell === "false") {
			shell = false
		}
		if (typeof script?.shell === "string") {
			shell = script.shell
		}
	} else if ("shebang" in script) {
		command = script.shebang
		;[command, ...args] = script.shebang.split(" ")
		args.push(filePath)
	}

	if ("cwd" in script) {
		cwd = untildify(script.cwd)
	}

	return {
		command,
		args,
		shell,
		cwd,
		filePath
	}
}
