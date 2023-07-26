// Name: Theme Selector
// Description: Preview and Apply Themes
// Keyword: theme
// Cache: true

import "@johnlindquist/kit"
import { globby } from "globby"

let themePaths = await globby([
  kitPath("themes", "*.json"),
  kenvPath("themes", "*.json"),
])
let guide = await readFile(kitPath("GUIDE.md"), "utf-8")

let themes = []

// Sort script-kit-dark and script-kit-light
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
  }
  theme.value = themePath
  themes.push(theme)
}

let themePath = await arg(
  {
    placeholder: "Theme Selector",
    hint: `Design your own: <a href="submit:theme-designer">Open Theme Designer</a>`,
    preview: md(guide),
    enter: "Set Theme",
  },
  themes
)

if (themePath === "theme-designer") {
  await run(kitPath("pro", "theme-designer.js"))
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
  await setInput("")
  await mainScript()
}
