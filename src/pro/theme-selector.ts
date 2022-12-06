// Name: Theme Selector
// Description: Preview and Apply Themes
import "@johnlindquist/kit"
let themes = {
  ["Script Kit"]: {
    foreground: "white",
    background: "black",
    accent: "251, 191, 36",
    ui: "52, 52, 52",
    opacity: "0.85",
  },
  ["VS Code Light"]: {
    foreground: "2C2C2C",
    accent: "2F86D3",
    background: "white",
    opacity: "0.85",
    ui: "CCCCF0",
  },

  "One Dark Pro": {
    foreground: "#ABB2BF",
    accent: "#C792EA",
    background: "#282C34",
    opacity: "0.9",
    ui: "#4B5563",
  },
  Dracula: {
    foreground: "#F8F8F0",
    accent: "#FF79C6",
    background: "#282A36",
    opacity: "0.9",
    ui: "#546E7A",
  },
  "Material Theme": {
    foreground: "#FFFFFF",
    accent: "#80CBC4",
    background: "#263238",
    opacity: "0.7",
    ui: "#9E9D24",
  },
  Nord: {
    foreground: "#D8DEE9",
    accent: "#EBCB8B",
    background: "#2E3440",
    opacity: "0.7",
    ui: "#583822",
  },
  "SynthWave '84": {
    foreground: "#FFFFFF",
    accent: "#FF79C6",
    background: "#2B213A",
    opacity: "0.7",
    ui: "#5E3947",
  },
  "Atom One Dark": {
    foreground: "#ABB2BF",
    accent: "#56B6C2",
    background: "#282C34",
    opacity: "0.8",
    ui: "#4C5F2F",
  },
  "Monokai Dimmed": {
    foreground: "#F8F8F2",
    accent: "#A090A0",
    background: "#272822",
    opacity: "0.9",
    ui: "#7B6F3E",
  },
  "Material Palenight": {
    foreground: "#FFFFFF",
    accent: "#F78C6C",
    background: "#292D3E",
    opacity: "0.8",
    ui: "#647C32",
  },
  "Gruvbox Dark": {
    foreground: "#FBF1C7",
    accent: "#8EC07C",
    background: "#282828",
    opacity: "0.85",
    ui: "#5E3947",
  },
  "Solarized Dark": {
    foreground: "#ffffff",
    accent: "#2AA198",
    background: "#002B36",
    opacity: "0.6",
    ui: "#5E3947",
  },
}
let guide = await readFile(kitPath("GUIDE.md"), "utf-8")
onTab("Select a Theme", async () => {
  const themeName = await arg(
    {
      placeholder: "Theme Selector",
      preview: md(guide),
      onChoiceFocus: (input, { focused }) => {
        setScriptTheme(themes[focused.value])
      },
      enter: "Set Theme",
    },
    Object.keys(themes).map(theme => {
      return {
        name: theme,
        description: `This is the ${theme} theme`,
        value: theme,
      }
    })
  )
  await setTheme(themes[themeName])
  await mainScript()
})
onTab("Customize Theme (Coming Soon!)", async () => {
  await arg("Nothing to see here")
})

onTab("Account__", async () => {
  await arg("Nothing to see here")
})
