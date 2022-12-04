// Name: Theme Selector
// Description: Preview and Apply Themes
import "@johnlindquist/kit"
let themes = {
  ["Script Kit"]: {},
  ["VS Code Light"]: {
    foreground: "2C2C2C",
    accent: "2F86D3",
    background: "white",
    opacity: "1",
  },
  ["Shades of Purple"]: {
    foreground: "F8F8F2",
    accent: "BD93F9",
    background: "282A36",
    opacity: "0.8",
  },
  ["Material Dark"]: {
    foreground: "ECEFF4",
    accent: "81A1C1",
    background: "2E3440",
    opacity: "0.8",
  },
  ["Dracula"]: {
    foreground: "F8F8F0",
    accent: "BD93F9",
    background: "282A36",
    opacity: "0.8",
  },
  ["One Dark"]: {
    foreground: "F8F8F2",
    accent: "E06C75",
    background: "282C34",
    opacity: "0.8",
  },
  ["One Light"]: {
    foreground: "282C34",
    accent: "E06C75",
    background: "FAFAFA",
    opacity: "0.9",
  },
  ["Nord"]: {
    foreground: "D8DEE9",
    accent: "EBCB8B",
    background: "2E3440",
    opacity: "0.9",
  },
  ["Night Owl"]: {
    foreground: "C0C5CE",
    accent: "C792EA",
    background: "011627",
    opacity: "0.9",
  },
  ["Cobalt2"]: {
    foreground: "F8F8F2",
    accent: "528BFF",
    background: "1D1F21",
    opacity: "0.9",
  },
  ["SynthWave '84"]: {
    foreground: "FFFFFF",
    accent: "FF79C6",
    background: "2B213A",
    opacity: "0.9",
  },
  ["High Contrast"]: {
    foreground: "FFFFFF",
    accent: "FFFFFF",
    background: "000000",
    opacity: "0.9",
  },
  ["Monokai"]: {
    foreground: "F8F8F2",
    accent: "66D9EF",
    background: "272822",
    opacity: "0.9",
  },
  ["Material"]: {
    foreground: "FFFFFF",
    accent: "80CBC4",
    background: "263238",
    opacity: "0.7",
  },
  ["Solarized"]: {
    foreground: "white",
    accent: "586E75",
    background: "002B36",
    opacity: "0.1",
  },
  ["Tomorrow"]: {
    foreground: "000000",
    accent: "4D4D4C",
    background: "FFFFFF",
    opacity: "0.9",
  },
  ["Material Palenight"]: {
    foreground: "FFFFFF",
    accent: "F78C6C",
    background: "292D3E",
    opacity: "0.9",
  },
  ["Gruvbox"]: {
    foreground: "FBF1C7",
    accent: "EBDBB2",
    background: "282828",
    opacity: "0.9",
  },
  ["Tokyo Night"]: {
    foreground: "C0CAF5",
    accent: "D19A66",
    background: "1A1B26",
    opacity: "0.9",
  },
  "Atelier Cave Dark": {
    background: "19171c",
    foreground: "efecf4",
    accent: "2a9292",
  },
  "Atelier Cave Light": {
    background: "efecf4",
    foreground: "19171c",
    accent: "2a9292",
  },
  "Atelier Dune Dark": {
    background: "20201d",
    foreground: "fefbec",
    accent: "60ac39",
  },
  "Atelier Dune Light": {
    background: "fefbec",
    foreground: "20201d",
    accent: "60ac39",
  },
  "Atelier Estuary Dark": {
    background: "22221b",
    foreground: "f4f3ec",
    accent: "7d9726",
  },
  "Atelier Estuary Light": {
    background: "f4f3ec",
    foreground: "22221b",
    accent: "7d9726",
  },
  "Atelier Forest Dark": {
    background: "1b1918",
    foreground: "f1efee",
    accent: "7b9726",
  },
  "Atelier Forest Light": {
    background: "f1efee",
    foreground: "1b1918",
    accent: "7b9726",
  },
  "Atelier Heath Dark": {
    background: "1b181b",
    foreground: "f7f3f7",
    accent: "918b3b",
  },
  "Atelier Heath Light": {
    background: "f7f3f7",
    foreground: "1b181b",
    accent: "918b3b",
  },
  "Atelier Lakeside Dark": {
    background: "161b1d",
    foreground: "ebf8ff",
    accent: "568c3b",
  },
  "Atelier Lakeside Light": {
    background: "ebf8ff",
    foreground: "161b1d",
    accent: "568c3b",
  },
  "Atelier Plateau Dark": {
    background: "1b1818",
    foreground: "f4ecec",
    accent: "4b8b8b",
  },
  "Atelier Plateau Light": {
    background: "f4ecec",
    foreground: "1b1818",
    accent: "4b8b8b",
  },
  "Atelier Savanna Dark": {
    background: "171c19",
    foreground: "ecf4ee",
    accent: "489963",
  },
  "Atelier Savanna Light": {
    background: "ecf4ee",
    foreground: "171c19",
    accent: "489963",
  },
  "Atelier Seaside Dark": {
    background: "131513",
    foreground: "f4fbf4",
    accent: "29a329",
  },
  "Atelier Seaside Light": {
    background: "f4fbf4",
    foreground: "131513",
    accent: "29a329",
  },
  "Atelier Sulphurpool Dark": {
    background: "202746",
    foreground: "f5f7ff",
    accent: "ac9739",
  },
  "Atelier Sulphurpool Light": {
    background: "f5f7ff",
    foreground: "202746",
    accent: "ac9739",
  },
  "Github V2": {
    background: "ffffff",
    foreground: "333333",
    accent: "183691",
  },
  Github: {
    background: "ffffff",
    foreground: "333333",
    accent: "dd1144",
  },
  "Tranquil Heart": {
    background: "2f3640",
    foreground: "e6e9ed",
    accent: "ffce54",
  },
  "Vibrant Ink": {
    background: "000000",
    foreground: "ffffff",
    accent: "66ff00",
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
