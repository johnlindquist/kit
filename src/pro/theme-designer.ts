import "@johnlindquist/kit"
import slugify from "slugify"
import { globby } from "globby"
import { getGroupedScripts } from "../api/kit.js"

// Name: Widget Theme Picker
// Description: Color Picker HTML

await ensureDir(kenvPath("themes"))
let themePaths = await globby([
  kenvPath("themes", "*.json"),
])

let themeName = ""
let themePath = ""
let theme = {
  name: "Custom Theme",
  foreground: "#ffffff",
  accent: "#fbbf24",
  ui: "#343434",
  background: "#000000",
  opacity: "0.85",
}
if (themePaths.length) {
  themePath = await arg(
    "Select existing or create new theme",
    themePaths.concat(["New Theme"])
  )
  if (themePath === "New Theme") {
    themeName = await arg("Name new theme")
  } else {
    theme = await readJson(themePath)
    themeName = theme?.name || "Custom Theme"
  }
} else {
  themeName = await arg("Name new theme")
}

let themeSlug = slugify(themeName, {
  lower: true,
  trim: true,
})

themePath ||= kenvPath("themes", `${themeSlug}.json`)
let themeExists = await isFile(themePath)
if (!themeExists) {
  await writeJson(themePath, theme, {
    spaces: 2,
  })
}

const { foreground, accent, ui, background, opacity } =
  theme

let w = await widget(
  `
<div class="flex flex-col w-full h-full p-8">
    Foreground:
    <input type="color" label="foreground" data-label="foreground" value="${foreground}" />
    Background:
    <input type="color" label="background" data-label="background" value="${background}" />
    Accent:
    <input type="color" label="accent" data-label="accent" value="${accent}"/>
    UI:
    <input type="color" label="ui" data-label="ui" value="${ui}"/>

    Opacity:
    <input type="range" min="0" max="1" step="0.01" label="opacity" data-label="opacity" value="${opacity}"/>

    Save:
    <button data-name="save" class="bg-ui-bg rounded py-0.5 px-1.5">Save</button>

</div>`,
  {
    width: 300,
    height: 300,
    draggable: false,
  }
)

w.onInput(
  debounce(event => {
    theme[event.dataset.label] = event.value
    setTheme({
      [event.dataset.label]: event.value,
    })

    writeJson(themePath, theme, {
      spaces: 2,
    })
  }, 250)
)

w.onClick(async event => {
  if (event.dataset.name === "save") {
    let appearance = await arg(
      `Use ${themeName} for Appearance`,
      ["Light", "Dark", "Both"]
    )
    if (appearance === "Light" || appearance === "Both") {
      await cli("set-env-var", "KIT_THEME_LIGHT", themePath)
    }

    if (appearance === "Dark" || appearance === "Both") {
      await cli("set-env-var", "KIT_THEME_DARK", themePath)
    }

    w.close()
    exit()
  }
})

let scripts = await getGroupedScripts()

setTimeout(() => {
  setTheme(theme)
}, 500)
await arg(
  {
    placeholder: `Sample Prompt for Theme Design`,
    hint: `Click "save" to continue`,
    ignoreBlur: true,
    alwaysOnTop: true,
  },
  scripts
)
