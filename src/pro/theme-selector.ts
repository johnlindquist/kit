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

let cssPath = await arg(
	{
		placeholder: "Select Theme",
		headerClassName: "",
		footerClassName: "",
		shortcuts: [],
		onEscape: async () => {
			await setScriptTheme("")
			exit()
		}
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
}
await setInput("")
await mainScript()
