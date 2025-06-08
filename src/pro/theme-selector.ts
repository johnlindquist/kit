// Name: Theme Selector
// Description: Preview and Apply Themes
// Keyword: theme
// Cache: true

import "@johnlindquist/kit"
import { globby } from "globby"

let customThemePaths = await globby([
	kenvPath("themes", "*.css").replaceAll("\\", "/")
])

let themePaths = await globby([
	kitPath("themes", "*.css").replaceAll("\\", "/"),
	`!${kitPath("themes", "script-kit*.css").replaceAll("\\", "/")}`
])

let defaultThemePaths = await globby([
	kitPath("themes", "script-kit*.css").replaceAll("\\", "/")
])

let guide = await readFile(kitPath("API.md"), "utf-8")

let themes = []

for await (let themePath of defaultThemePaths) {
	let css = await readFile(themePath, "utf-8")
	let themeName = path.basename(themePath)
	let theme = {
		group: "Default",
		name: themeName,
		description: themePath,
		value: themePath,
		enter: "Apply Theme",
		preview: async () => {
			setScriptTheme(css)

			return md(
				`# Preview of ${themeName}
    
${guide}`
			)
		}
	}

	themes.push(theme)
}

for await (let cssPath of themePaths) {
	let css = await readFile(cssPath, "utf-8")
	let themeName = path.basename(cssPath)
	let theme = {
		group: "Built-in",
		name: themeName,
		description: cssPath,
		value: cssPath,
		enter: "Apply Theme",
		preview: async () => {
			setScriptTheme(css)

			return md(
				`# Preview of ${themeName}
    
${guide}`
			)
		}
	}

	themes.push(theme)
}

for await (let cssPath of customThemePaths) {
	let css = await readFile(cssPath, "utf-8")
	let themeName = path.basename(cssPath)
	let theme = {
		group: "Custom",
		name: themeName,
		description: cssPath,
		value: cssPath,
		enter: "Apply Theme",
		preview: async () => {
			setScriptTheme(css)

			return md(
				`# Preview of ${themeName}
		
	${guide}`
			)
		}
	}
	themes.push(theme)
}

let RESET = "Reset to Defaults"

if (env.KIT_THEME_LIGHT || env.KIT_THEME_DARK) {
	themes.unshift({
		group: "Kit",
		name: RESET,
		description: "Reset both light and dark themes to defaults",
		value: RESET,
		enter: "Reset",
		preview: md(`# Reset to Defaults
  
  Clear both \`KIT_THEME_LIGHT\` and \`KIT_THEME_DARK\` environment variables to reset to defaults.
  `)
	})
}

themes = groupChoices(themes, {
	order: ["Kit", "Default", "Custom", "Built-in"]
})

// Check if kit.css exists
let kitCssExists = await pathExists(kenvPath("kit.css"))
let warningText = ""
if (kitCssExists) {
	warningText = `<div class="p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md mb-4">
		<p class="font-semibold">⚠️ Note: You have a kit.css file</p>
		<p class="text-sm mt-1">Your kit.css styles will be applied on top of any theme you select here.</p>
	</div>`
}

let cssPath = await arg(
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
	let appearance = await arg(`Use ${path.basename(cssPath)} When Appearance`, [
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

	let theme = await readFile(cssPath, "utf-8")
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
