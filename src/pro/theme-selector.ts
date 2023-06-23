// Name: Theme Selector
// Description: Preview and Apply Themes
import "@johnlindquist/kit"
let themes = {
  ["Script Kit"]: {
    foreground: "255, 255, 255",
    background: "22, 22, 22",
    accent: "251, 191, 36",
    opacity: isMac ? "0.5" : "0.95",
    ui: "255, 255, 255",
    "ui-bg-opacity": "0.05",
    "ui-border-opacity": "0.15",
    vibrancy: "popover",
    appearance: "dark",
  },
  ["Script Kit Light"]: {
    foreground: "2C2C2C",
    accent: "2F86D3",
    background: "white",
    opacity: isMac ? "0.75" : "1",
    ui: "204, 204, 204",
    "ui-bg-opacity": isMac ? "0.25" : "0.5",
    "ui-border-opacity": "0.5",
    vibrancy: "popover",
    appearance: "light",
  },
  ["One Dark Pro"]: {
    foreground: "ABB2BF",
    background: "282C34",
    accent: "61AFEF",
    ui: "3D4349",
    opacity: isMac ? "0.6" : "1",
  },
  ["Material Theme"]: {
    foreground: "EEFFFF",
    background: "263238",
    accent: "80CBC4",
    ui: "374850",
    opacity: isMac ? "0.6" : "1",
  },
  ["Dracula"]: {
    foreground: "F8F8F2",
    background: "282A36",
    accent: "BD93F9",
    ui: "4B4E60",
    opacity: isMac ? "0.6" : "1",
  },
  ["Monokai"]: {
    foreground: "F8F8F2",
    background: "272822",
    accent: "FD971F",
    ui: "75715E",
    opacity: isMac ? "0.6" : "1",
  },
  ["Nord"]: {
    foreground: "D8DEE9",
    background: "2E3440",
    accent: "88C0D0",
    ui: "3B4254",
    opacity: isMac ? "0.6" : "1",
  },
  ["Solarized Light"]: {
    foreground: "657B83",
    background: "FDF6E3",
    accent: "268BD2",
    ui: "ECE9D5",
    opacity: isMac ? "0.6" : "1",
  },
  ["Solarized Dark"]: {
    foreground: "839496",
    background: "002B36",
    accent: "268BD2",
    ui: "073A42",
    opacity: isMac ? "0.6" : "1",
  },
  ["Cobalt2"]: {
    foreground: "F0F0F0",
    background: "002240",
    accent: "FF9D00",
    ui: "193A59",
    opacity: isMac ? "0.6" : "1",
  },
  ["Night Owl"]: {
    foreground: "D6DEEB",
    background: "011627",
    accent: "82AAFF",
    ui: "0B3F91",
    opacity: isMac ? "0.6" : "1",
  },
  ["Aylin"]: {
    foreground: "D7DEEA",
    background: "171E24",
    accent: "6D8EAD",
    ui: "263146",
    opacity: isMac ? "0.6" : "1",
  },
  ["City Lights"]: {
    foreground: "5FD7FF",
    background: "1D252C",
    accent: "5CA0D3",
    ui: "263542",
    opacity: isMac ? "0.6" : "1",
  },
  ["Gruvbox"]: {
    foreground: "EBDBB2",
    background: "282828",
    accent: "FE8019",
    ui: "3C3936",
    opacity: isMac ? "0.6" : "1",
  },
  ["Horizon"]: {
    foreground: "BBBBBB",
    background: "1C1E26",
    accent: "E95678",
    ui: "2E3146",
    opacity: isMac ? "0.6" : "1",
  },
  ["Lucario"]: {
    foreground: "F8F8F2",
    background: "2B3E50",
    accent: "F8F8F2",
    ui: "2B405A",
    opacity: isMac ? "0.6" : "1",
  },
  ["Oceanic Next"]: {
    foreground: "CDD3DE",
    background: "1B2B34",
    accent: "6699CC",
    ui: "2E3943",
    opacity: isMac ? "0.6" : "1",
  },
  ["Panda"]: {
    foreground: "E6E6E6",
    background: "292A2B",
    accent: "19F9D8",
    ui: "303030",
    opacity: isMac ? "0.6" : "1",
  },
  ["Quiet Light"]: {
    foreground: "403F53",
    background: "F5F3F3",
    accent: "A90D91",
    ui: "EDE8E8",
    opacity: isMac ? "0.6" : "1",
  },
  ["Seti"]: {
    foreground: "C5C8C6",
    background: "1E1F29",
    accent: "B1AB7D",
    ui: "32364A",
    opacity: isMac ? "0.6" : "1",
  },
  ["Shades of Purple"]: {
    foreground: "D1D1D1",
    background: "2D2B55",
    accent: "9E86C8",
    ui: "3E3B85",
    opacity: isMac ? "0.6" : "1",
  },
  ["SynthWave '84"]: {
    foreground: "EDEDED",
    background: "2B213A",
    accent: "FF6584",
    ui: "41246A",
    opacity: isMac ? "0.6" : "1",
  },
  ["Tomorrow Night Blue"]: {
    foreground: "C5C8C6",
    background: "002451",
    accent: "519F50",
    ui: "0D3E66",
    opacity: isMac ? "0.6" : "1",
  },
  ["Twilight"]: {
    foreground: "C1C1C1",
    background: "141414",
    accent: "AC885B",
    ui: "1F2121",
    opacity: isMac ? "0.6" : "1",
  },

  ["GitHub Light"]: {
    foreground: "24292E",
    background: "FFFFFF",
    accent: "0366D6",
    ui: "F0F1F4",
    opacity: isMac ? "0.6" : "1",
  },
  ["Atom Light"]: {
    foreground: "383A42",
    background: "FBFCFC",
    accent: "4078F2",
    ui: "E5E8EC",
    opacity: isMac ? "0.6" : "1",
  },
  ["Solarized Light (Alternate)"]: {
    foreground: "586E75",
    background: "FDF6E3",
    accent: "2AA198",
    ui: "E9E4D1",
    opacity: isMac ? "0.6" : "1",
  },
  ["One Light"]: {
    foreground: "383A42",
    background: "FAFBFC",
    accent: "61AFEF",
    ui: "E0E2E5",
    opacity: isMac ? "0.6" : "1",
  },
  ["Flat UI Light"]: {
    foreground: "4D4D4C",
    background: "EDEDED",
    accent: "1ABC9C",
    ui: "E0E0E0",
    opacity: isMac ? "0.6" : "1",
  },
  ["Kary Foundation Light"]: {
    foreground: "3E3E3E",
    background: "FFFFFF",
    accent: "007ACC",
    ui: "F2F2F2",
    opacity: isMac ? "0.6" : "1",
  },
  ["Brackets Light"]: {
    foreground: "535353",
    background: "F9F9F9",
    accent: "E74C3C",
    ui: "EDEDED",
    opacity: isMac ? "0.6" : "1",
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
