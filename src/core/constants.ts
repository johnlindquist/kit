import { home, kenvPath, kitPath, knodePath } from "./resolvers.js"
import { isMac, isWin } from "./is.js"

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
