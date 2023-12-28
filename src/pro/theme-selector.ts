// Name: Theme Selector
// Description: Preview and Apply Themes
// Keyword: theme
// Cache: true

import "@johnlindquist/kit"
import { globby } from "globby"

let themePaths = await globby([
  kitPath("themes", "*.json").replaceAll("\\", "/"),
  kenvPath("themes", "*.json").replaceAll("\\", "/"),
])
let guide = await readFile(kitPath("GUIDE.md"), "utf-8")

let themes = []

// Sort script-kit-dark and script-kit-light to the top
themePaths.sort((a, b) => {
  if (a.includes("script-kit")) {
    return -1
  }
  return 1
})

let themeName = ""
for await (let themePath of themePaths) {
  let theme = await readJson(themePath)
  theme.preview = async () => {
    themeName = theme.name
    setScriptTheme(theme)

    return md(
      `# Preview of ${theme.name}
    
` + guide
    )
  }
  theme.value = themePath
  theme.description = themePath
  theme.enter = "Apply Theme"
  themes.push(theme)
}

let RESET = "Reset to Defaults"

themes.unshift({
  name: "Theme Designer",
  enter: "Open Theme Designer",
  description: "Design your own theme",
  value: "theme-designer",
  preview: md(`# Theme Designer 
    
Design your own using the theme design widget.    
    `),
})

if (env.KIT_THEME_LIGHT || env.KIT_THEME_DARK) {
  themes.unshift({
    name: RESET,
    description:
      "Reset both light and dark themes to defaults",
    value: RESET,
    enter: "Reset",
    preview: md(`# Reset to Defaults
  
  Clear both \`KIT_THEME_LIGHT\` and \`KIT_THEME_DARK\` environment variables to reset to defaults.
  `),
  })
}

let themePath = await arg("Theme Selector", themes)

if (themePath === "theme-designer") {
  await run(kitPath("pro", "theme-designer.js"))
} else {
  if (themePath === RESET) {
    await cli("remove-env-var", "KIT_THEME_LIGHT")
    await cli("remove-env-var", "KIT_THEME_DARK")
  } else {
    let appearance = await arg(
      `Use ${themeName} When Appearance`,
      ["Light", "Dark", "Both"]
    )
    if (appearance === "Light" || appearance === "Both") {
      await cli("set-env-var", "KIT_THEME_LIGHT", themePath)
    }

    if (appearance === "Dark" || appearance === "Both") {
      await cli("set-env-var", "KIT_THEME_DARK", themePath)
    }
  }

  await setInput("")
  await mainScript()
}
