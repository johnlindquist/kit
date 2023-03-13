// Name: Theme Selector
// Description: Preview and Apply Themes
import "@johnlindquist/kit"
let themes = {
  ["Script Kit"]: {
    foreground: "white",
    background: "6, 6, 6",
    accent: "251, 191, 36",
    ui: "64, 64, 64",
    opacity: "0.75",
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
    opacity: "0.75",
    ui: "#5E3947",
  },
  "Solarized Dark": {
    foreground: "#ffffff",
    accent: "#2AA198",
    background: "#002B36",
    opacity: "0.6",
    ui: "#5E3947",
  },
  Cobalt2: {
    foreground: "#FFFFFF",
    accent: "#FFC600",
    background: "#193549",
    opacity: "0.8",
    ui: "#5E3947",
  },
  "Shades of Purple": {
    foreground: "#FFFFFF",
    accent: "#FF9D00",
    background: "#2D2B55",
    opacity: "0.9",
    ui: "#9E9D24",
  },
  "Winter is Coming": {
    foreground: "#D4D4D4",
    accent: "#569CD6",
    background: "#1E1E1E",
    opacity: "0.75",
    ui: "80, 80, 80",
  },
  "Monokai Pro": {
    foreground: "#FCFCFA",
    accent: "#FC9867",
    background: "#2D2A2E",
    opacity: "0.9",
    ui: "#7B6F3E",
  },
  Omni: {
    foreground: "#E1E1E6",
    accent: "#FF79C6",
    background: "#191622",
    opacity: "0.8",
    ui: "#9E9D24",
  },
  "Tokyo Night": {
    foreground: "#C0CAF5",
    accent: "#7AA2F7",
    background: "#1A1B26",
    opacity: "0.75",
    ui: "#647C32",
  },
  Noctis: {
    foreground: "#F3F3F3",
    accent: "#4CBF99",
    background: "#282A36",
    opacity: "0.9",
    ui: "#5E3947",
  },
  Panda: {
    foreground: "#E6E6E6",
    accent: "#FF2C83",
    background: "#292A2B",
    opacity: "0.8",
    ui: "#4C5F2F",
  },
  Andromeda: {
    foreground: "#FFFFFF",
    accent: "#FF4081",
    background: "#212121",
    opacity: "0.8",
    ui: "#9E9D24",
  },
  Darcula: {
    foreground: "#A9B7C6",
    accent: "#BB86FC",
    background: "#282828",
    opacity: "0.75",
    ui: "#583822",
  },
  Eva: {
    foreground: "#EEEEEE",
    accent: "#FFEB3B",
    background: "#32374D",
    opacity: "0.8",
    ui: "#647C32",
  },
  Bearded: {
    foreground: "#FFFFFF",
    accent: "#00BCD4",
    background: "#262626",
    opacity: "0.75",
    ui: "#5e3947",
  },
  Vue: {
    foreground: "#FFFFFF",
    accent: "#41B883",
    background: "#273849",
    opacity: "0.8",
    ui: "#4c5f2f",
  },
}
let guide = await readFile(kitPath("GUIDE.md"), "utf-8")

const themeName = await arg(
  {
    placeholder: "Theme Selector",
    hint: `Design your own: <a href="submit:theme-designer">Open Theme Designer</a>`,
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

if (themeName === "theme-designer") {
  await run(kitPath("pro", "theme-designer.js"))
} else {
  await setTheme(themes[themeName])
  await mainScript()
}
