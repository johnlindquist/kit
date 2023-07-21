let screens = await getScreens()

let widgets = []

for (let s of screens) {
  let w = await widget(
    md(`# <span class="text-4xl">${s.id}</span>`),
    {
      x: s.workArea.x,
      y: s.workArea.y,
      transparent: true,
    }
  )
  widgets.push(w)
}

let displayId = await arg(
  "Select default display",
  screens.map(s => s.id.toString())
)

await cli("set-env-var", "KIT_DISPLAY", displayId)

for (let w of widgets) {
  await w.close()
}

export {}
