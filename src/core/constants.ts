import { home, kenvPath, kitPath } from "./resolvers.js"
import { isMac } from "./is.js"

export let cmd = isMac ? "cmd" : "ctrl"
export let returnOrEnter = isMac ? "return" : "enter"

export const scriptsDbPath = kitPath("db", "scripts.json")
export const timestampsPath = kitPath("db", "timestamps.json")
export const statsPath = kitPath("db", "stats.json")
export const prefsPath = kitPath("db", "prefs.json")
export const promptDbPath = kitPath("db", "prompt.json")
export const themeDbPath = kitPath("db", "theme.json")
export const userDbPath = kitPath("db", "user.json")
export const tmpClipboardDir = kitPath("tmp", "clipboard")
export const tmpDownloadsDir = kitPath("tmp", "downloads")

export const getMainScriptPath = () => {
	const version = process.env?.KIT_MAIN_SCRIPT
	return kitPath("main", `index${version ? `-${version}` : ""}.js`)
}

export const kitDocsPath = home(".kit-docs")

export const KENV_SCRIPTS = kenvPath("scripts")
export const KENV_APP = kenvPath("app")
export const KENV_BIN = kenvPath("bin")

export const KIT_APP = kitPath("run", "app.js")
export const KIT_APP_PROMPT = kitPath("run", "app-prompt.js")
export const KIT_APP_INDEX = kitPath("run", "app-index.js")

export const SHELL_TOOLS = [
	"bash",
	"sh",
	"zsh",
	"fish",
	"powershell",
	"pwsh",
	"cmd"
]

/**
 * All valid scriptlet tool types.
 * This includes:
 * - Script/Kit tools: '', 'kit', 'ts', 'js'
 * - Transform/Template: 'transform', 'template'
 * - Action tools: 'open', 'edit', 'paste', 'type', 'submit'
 * - Shell tools: bash, sh, zsh, fish, powershell, pwsh, cmd
 * - Language interpreters: ruby, python, python3, perl, php, node, etc.
 */
export const VALID_TOOLS = [
	// Script/Kit tools
	"",
	"kit",
	"ts",
	"js",
	// Transform/Template
	"transform",
	"template",
	// Action tools
	"open",
	"edit",
	"paste",
	"type",
	"submit",
	// Shell tools
	...SHELL_TOOLS,
	// Language interpreters
	"ruby",
	"python",
	"python3",
	"perl",
	"php",
	"node",
	"lua",
	"r",
	"groovy",
	"scala",
	"swift",
	"go",
	"rust",
	"java",
	"clojure",
	"elixir",
	"erlang",
	"ocaml",
	"osascript",
	"deno",
	"kotlin",
	"julia",
	"dart",
	"haskell",
	"csharp"
] as const

export type ToolType = typeof VALID_TOOLS[number]
