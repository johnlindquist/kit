// Name: Theme Selector
// Description: Preview and Apply Themes
// Keyword: theme
// Cache: true

import "@johnlindquist/kit"
import { loadThemePaths, buildThemeChoices } from "../core/theme-loader.js"

// Load all theme paths using shared utility
const paths = await loadThemePaths(kenvPath, kitPath)

// Load preview content
const guide = await readFile(kitPath("API.md"), "utf-8")

// Build theme choices using shared utility
let themes = await buildThemeChoices({
	paths,
	readFile,
	pathModule: path,
	setScriptTheme,
	md,
	previewContent: guide,
})

const RESET = "Reset to Defaults"

// Add reset option if custom themes are configured
if (env.KIT_THEME_LIGHT || env.KIT_THEME_DARK) {
	themes.unshift({
		group: "Kit",
		name: RESET,
		description: "Reset both light and dark themes to defaults",
		value: RESET,
		enter: "Reset",
		preview: async () => md(`# Reset to Defaults

  Clear both \`KIT_THEME_LIGHT\` and \`KIT_THEME_DARK\` environment variables to reset to defaults.
  `)
	})
}

themes = groupChoices(themes, {
	order: ["Kit", "Default", "Custom", "Built-in"]
}) as typeof themes

// Check if kit.css exists
const kitCssExists = await pathExists(kenvPath("kit.css"))
let warningText = ""
if (kitCssExists) {
	warningText = `<div class="p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md mb-4">
		<p class="font-semibold">⚠️ Note: You have a kit.css file</p>
		<p class="text-sm mt-1">Your kit.css styles will be applied on top of any theme you select here.</p>
	</div>`
}

const cssPath = await arg(
	{
		placeholder: "Select Theme",
		headerClassName: "",
		footerClassName: "",
		shortcuts: [],
		onEscape: async () => {
			await setScriptTheme("")
			exit()
		},
		panel: kitCssExists ? md(warningText) : ""
	},
	themes
)

if (cssPath === RESET) {
	await cli("remove-env-var", "KIT_THEME_LIGHT")
	await cli("remove-env-var", "KIT_THEME_DARK")
} else {
	const appearance = await arg(`Use ${path.basename(cssPath)} When Appearance`, [
		"Light",
		"Dark",
		"Both"
	])
	if (appearance === "Light" || appearance === "Both") {
		await cli("set-env-var", "KIT_THEME_LIGHT", cssPath)
	}

	if (appearance === "Dark" || appearance === "Both") {
		await cli("set-env-var", "KIT_THEME_DARK", cssPath)
	}

	const theme = await readFile(cssPath, "utf-8")
	await setTheme(theme)

	// Show notification if kit.css exists
	if (kitCssExists) {
		await notify({
			title: "Theme Applied",
			body: "Your kit.css file is still active and will override theme styles. Remove kit.css to use only the selected theme."
		})
	}
}
await setInput("")
await mainScript()
