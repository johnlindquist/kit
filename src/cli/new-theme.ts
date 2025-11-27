/*
# New Theme

Create a new theme based on the current theme
*/

// Name: New Theme
// Description: Create a new theme
// Log: false
// Pass: true
// Keyword: nt

import { loadThemePaths, buildThemeChoices, replaceThemeName, slugifyThemeName } from "../core/theme-loader.js"

await ensureDir(kenvPath("themes"))

// Load all theme paths using shared utility
const paths = await loadThemePaths(kenvPath, kitPath)

// Load preview content
const guide = await readFile(kitPath("GUIDE.md"), "utf-8")

// Build theme choices using shared utility
let themes = await buildThemeChoices({
  paths,
  readFile,
  pathModule: path,
  setScriptTheme,
  md,
  previewContent: guide,
})

themes = groupChoices(themes, {
  order: ["Default", "Custom", "Built-in"],
}) as typeof themes

const cssPath = await arg(
  {
    placeholder: "Select a Theme to Copy",
    hint: "Base New Theme on...",
    onEscape: async () => {
      await setScriptTheme("")
      exit()
    },
  },
  themes
)

let theme = await readFile(cssPath, "utf-8")

const name = arg?.pass || (await arg("Theme Name"))

// Convert name to filename slug using shared utility
const dashed = slugifyThemeName(name)

// Replace the --name variable with the new theme name using shared utility
theme = replaceThemeName(theme, name)

const themePath = kenvPath("themes", `${dashed}.css`)
await writeFile(themePath, theme)
await cli("set-env-var", "KIT_THEME_LIGHT", themePath)
await cli("set-env-var", "KIT_THEME_DARK", themePath)

await edit(themePath)

export type {}
