// Name: Main
// Description: Script Kit
// Placeholder: Run script
// UI: arg
// Exclude: true
// Cache: true
performance.measure("index", "run")

import { Channel, Value } from "../core/enum.js"
import {
	run,
	cmd,
	getMainScriptPath,
	isScriptlet,
	isSnippet
} from "../core/utils.js"
import type { Choice, Scriptlet, Script, Snippet } from "../types/core.js"
import {
	mainMenu,
	scriptFlags,
	actions,
	modifiers,
	errorPrompt,
	getFlagsFromActions
} from "../api/kit.js"
import type { Open } from "../types/packages.js"

console.clear()

if (env.KIT_EDITOR !== "code") {
	scriptFlags["code"] = {
		group: "Script Actions",
		name: "Open Kenv in VS Code",
		description: "Open the script's kenv in VS Code",
		shortcut: `${cmd}+shift+o`
	}
}

let panel = ``

// let submitted = false
// let onInput = input => {
//   if (input.startsWith("/")) submit("/")
//   if (input.startsWith("~")) submit("~")
//   if (input.startsWith(">")) submit(">")
//   submitted = true
// }

let onNoChoices = async (input, state) => {
	// if (submitted) return
	if (input && state.flaggedValue === "") {
		let regex = /[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/g
		let invalid = regex.test(input)

		if (invalid) {
			panel = md(`# No matches found
No matches found for <code>${input}</code>`)
			setPanel(panel)
			return
		}

		let scriptName = input
			.replace(/[^\w\s-]/g, "")
			.trim()
			.replace(/\s/g, "-")
			.toLowerCase()

		panel = md(`# Quick New Script

Create a script named <code>${scriptName}</code>
        `)
		setPanel(panel)
	}
}

/*
> terminal
~ browse home
/ browse root
' snippets
" word api
: emoji search
; app launcher
, "sticky note"
. file search
< clipboard history
0-9 calculator
? docs
*/

let isApp = false
let isPass = false
let input = ""
let focused: Choice | undefined

trace.instant({
	args: "mainMenu"
})
let script = await mainMenu({
	name: "Main",
	description: "Script Kit",
	placeholder: "Script Kit",
	enter: "Run",
	strict: false,
	flags: scriptFlags,
	onMenuToggle: async (input, state) => {
		if (!state?.flag) {
			let menuFlags = {
				...(scriptFlags as object),
				...getFlagsFromActions(actions)
			}
			setFlags(menuFlags)
		}
	},
	onKeyword: async (input, state) => {
		let { keyword, value } = state
		if (keyword) {
			if (value?.filePath) {
				preload(value?.filePath)
				await run(value.filePath, `--keyword`, keyword)
			}
		}
	},

	onSubmit: (i) => {
		if (i) {
			input = i.trim()
		}
	},
	onBlur: async (input, state) => {
		hide()
		exit()
	},
	onNoChoices,
	onChoiceFocus: async (input, state) => {
		isApp =
			state?.focused?.group === "Apps" || state?.focused?.group === "Community"
		isPass = state?.focused?.group === "Pass" && !state?.focused?.exact

		focused = state?.focused
	},
	// footer: `Script Options: ${cmd}+k`,
	shortcodes: {
		// "=": kitPath("handler", "equals-handler.js"),
		// ">": kitPath("handler", "greaterthan-handler.js"),
		// "/": kitPath("main", "browse.js"),
		// "~": kitPath("handler", "tilde-handler.js"),
		// "'": kitPath("handler", "quote-handler.js"),
		// '"': kitPath("handler", "doublequote-handler.js"),
		// ";": kitPath("handler", "semicolon-handler.js"),
		// ":": kitPath("handler", "colon-handler.js"),
		// ".": kitPath("handler", "period-handler.js"),
		// "\\": kitPath("handler", "backslash-handler.js"),
		// "|": kitPath("handler", "pipe-handler.js"),
		// ",": kitPath("handler", "comma-handler.js"),
		// "`": kitPath("handler", "backtick-handler.js"),
		// "<": kitPath("handler", "lessthan-handler.js"),
		// "-": kitPath("handler", "minus-handler.js"),
		// "[": kitPath("handler", "leftbracket-handler.js"),
		"1": `${kitPath("handler", "number-handler.js")} 1`,
		"2": `${kitPath("handler", "number-handler.js")} 2`,
		"3": `${kitPath("handler", "number-handler.js")} 3`,
		"4": `${kitPath("handler", "number-handler.js")} 4`,
		"5": `${kitPath("handler", "number-handler.js")} 5`,
		"6": `${kitPath("handler", "number-handler.js")} 6`,
		"7": `${kitPath("handler", "number-handler.js")} 7`,
		"8": `${kitPath("handler", "number-handler.js")} 8`,
		"9": `${kitPath("handler", "number-handler.js")} 9`
		// "0": kitPath("handler", "zero-handler.js"),
		// "?": kitPath("handler", "question-handler.js"),
	},

	actions,
	input: arg?.input || ""
})

trace.instant({
	args: "mainMenu submitted"
})

if (!script && Object.keys(flag).length === 0) {
	await errorPrompt({
		message: `An unknown error occurred. Please try again.`,
		name: "No Script or Flag Detected"
	})
}

if (typeof script === "boolean" && !script) {
	exit()
}

const runScript = async (script: Script | string) => {
	if (isApp && typeof script === "string") {
		return await Promise.all([
			hide({
				preloadScript: getMainScriptPath()
			}),
			(open as unknown as Open)(script as string)
		])
	}

	if (isPass || (script as Script)?.postfix) {
		let hardPass = (script as any).postfix || input
		if (typeof global?.flag === "object") {
			global.flag.hardPass = hardPass
		}
		return await run((script as Script)?.filePath, "--pass", hardPass)
	}

	if (script === Value.NoValue || typeof script === "undefined") {
		console.warn("🤔 No script selected", script)
		return
	}

	if (typeof script === "string") {
		if (script === "kit-sponsor") {
			return await run(kitPath("main", "sponsor.js"))
		}

		let scriptPath = script as string
		let [maybeScript, numarg] = scriptPath.split(/\s(?=\d)/)
		if (await isFile(maybeScript)) {
			return await run(maybeScript, numarg)
		}

		return await run(
			`${kitPath("cli", "new")}.js`,
			scriptPath.trim().replace(/\s/g, "-").toLowerCase(),
			`--scriptName`,
			scriptPath.trim()
		)
	}

	let shouldEdit = flag?.open

	let selectedFlag: string | undefined = Object.keys(flag).find((f) => {
		return f && !modifiers[f]
	})

	if (selectedFlag && flag?.code) {
		return await exec(
			`open -a 'Visual Studio Code' '${path.dirname(
				path.dirname(script.filePath)
			)}'`
		)
	}

	if (selectedFlag && selectedFlag === "settings") {
		return await run(kitPath("main", "kit.js"))
	}
	if (selectedFlag?.startsWith("kenv")) {
		let k = script.kenv || "main"
		if (selectedFlag === "kenv-term") {
			k = path.dirname(path.dirname(script.filePath))
		}

		return await run(`${kitPath("cli", selectedFlag)}.js`, k)
	}

	if (selectedFlag?.endsWith("menu")) {
		return await run(`${kitPath("cli", selectedFlag)}.js`)
	}

	if (selectedFlag && !flag?.open) {
		return await run(`${kitPath("cli", selectedFlag)}.js`, script.filePath)
	}

	if (flag[modifiers.opt]) {
		return showLogWindow(script?.filePath)
	}

	if (script.background) {
		return await run(kitPath("cli", "toggle-background.js"), script?.filePath)
	}

	if (shouldEdit) {
		return await edit(script.filePath, kenvPath())
	}

	if ((script as Script)?.shebang) {
		return await sendWait(Channel.SHEBANG, script)
	}

	if (isSnippet(script)) {
		send(Channel.STAMP_SCRIPT, script as Script)

		return await run(
			kitPath("app", "paste-snippet.js"),
			"--filePath",
			script.filePath
		)
	}

	if (isScriptlet(script)) {
		let { runScriptlet } = await import("./scriptlet.js")
		await runScriptlet(script, script.inputs || [])
		return
	}

	if (Array.isArray(script)) {
		let { runScriptlet } = await import("./scriptlet.js")
		await runScriptlet(focused as Scriptlet, script)
		return
	}

	if (script && script?.filePath) {
		preload(script?.filePath)
		let runP = run(script.filePath, ...Object.keys(flag).map((f) => `--${f}`))

		return await runP
	}

	return await arg("How did you get here?")
}

await runScript(script)
