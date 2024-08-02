/*
# New Theme

Create a new theme based on the current theme
*/

// Name: New Theme
// Description: Create a new snippet
// Log: false
// Pass: true
// Keyword: nt

await ensureDir(kenvPath("themes"))

let name = arg?.pass || (await arg("Theme Name"))

// convert name to dashed lowercase
let dashed = name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()

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

let guide = await readFile(kitPath("GUIDE.md"), "utf-8")

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

themes = groupChoices(themes, {
	order: ["Default", "Custom", "Built-in"]
})

let cssPath = await arg(
	{
		placeholder: "Select a Theme to Copy",
		hint: "Base New Theme on...",
		onEscape: async () => {
			await setScriptTheme("")
			exit()
		}
	},
	themes
)

let theme = await readFile(cssPath, "utf-8")
// Replace the --name variable with the new theme name
theme = theme.replace(/--name: ".*";/g, `--name: "${name}";`)
let themePath = kenvPath("themes", `${dashed}.css`)
await writeFile(themePath, theme)
await cli("set-env-var", "KIT_THEME_LIGHT", themePath)
await cli("set-env-var", "KIT_THEME_DARK", themePath)

await edit(themePath)

export type {}
