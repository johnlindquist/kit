import "@johnlindquist/kit"

// Name: Widget Theme Picker
// Description: Color Picker HTML

let themePath = kenvPath("theme.json")

if (!(await isFile(themePath))) {
  let defaultTheme = `{
        "foreground": "#ffffff",
        "accent": "#fbbf24",
        "ui": "#343434",
        "background": "#000000",
        "opacity": "0.85"
    }`.trim()

  await writeFile(themePath, defaultTheme)
}

const theme = await readJson(themePath)

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

</div>`,
  {
    width: 300,
    height: 300,
    draggable: false,
  }
)

w.onInput(event => {
  setTheme({
    [event.dataset.label]: event.value,
  })
  theme[event.dataset.label] = event.value
  writeJson(themePath, theme)
})

setIgnoreBlur(true)
await mainScript()
