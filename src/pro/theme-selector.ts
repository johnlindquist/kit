// Name: Theme Selector
// Description: Preview and Apply Themes
import "@johnlindquist/kit"
import { highlightJavaScript } from "../api/kit.js"
import { KitTheme } from "../types/kitapp"
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

onTab("Theme Randomizer (In Progress...)", async () => {
  let randomize = async () => {
    // random hex color, in 6 character hex with padding
    let randomHex = () => {
      let hex = Math.floor(
        Math.random() * 16777215
      ).toString(16)
      return hex.padStart(6, "0")
    }

    // random shade of black, in 6 character hex
    let randomGray = () => {
      let gray = Math.floor(Math.random() * 255)
      return gray.toString(16).repeat(3)
    }

    // random shade of white, in 6 character hex
    let randomWhite = () => {
      let white = Math.floor(255 - Math.random() * 20)
      return white.toString(16).repeat(3)
    }

    // random shade of black or white
    let randomGrayOrWhite = () => {
      return Math.random() > 0.5
        ? randomGray()
        : randomWhite()
    }

    // random value between 0.8 and 1
    let randomOpacity = () => {
      return (Math.random() * 0.2 + 0.8).toFixed(2)
    }

    let randomTheme = {
      foreground: `#${randomHex()}`,
      accent: `#${randomHex()}`,
      background: `#${randomGrayOrWhite()}`,
      ui: `#${randomHex()}`,
      opacity: `${randomOpacity()}`,
    }

    await setTheme(randomTheme as Partial<KitTheme>)

    setDescription(`Tap 'r' to randomize, 'c' to copy`)
    let preview = await highlightJavaScript(
      `
let theme = ${JSON.stringify(randomTheme, null, 2)}

// use setTheme to apply the theme
await setTheme(theme)  
    
    `.trim()
    )

    let className = "px-0"
    await arg(
      {
        placeholder: "Tap 'r' to randomize, 'c' to copy",
        hint: "These are truly random...",
        shortcuts: [
          {
            key: "r",
            name: "Randomize",
            onPress: async () => {
              await randomize()
            },
            bar: "right",
          },
          {
            key: "c",
            name: "Copy",
            onPress: async () => {
              copy(JSON.stringify(randomTheme, null, 2))
            },
            bar: "right",
          },
        ],
      },
      [
        {
          name: "Foreground",
          className,
          html: `<div class="w-full h-full text-bg-base p-2" style="background-color:${randomTheme.foreground}">Foreground</div>`,
          preview,
        },
        {
          name: "Accent",
          className,
          html: `<div class="w-full h-full text-text-base p-2" style="background-color:${randomTheme.accent}">Accent</div>`,
          preview,
        },
        {
          name: "Background",
          className,
          html: `<div class="w-full h-full text-text-base p-2" style="background-color:${randomTheme.background}">Background</div>`,
          preview,
        },
        {
          name: "UI",
          className,
          html: `<div class="w-full h-full text-text-base p-2" style="background-color:${randomTheme.ui}">UI</div>`,
          preview,
        },
      ]
    )
  }

  await randomize()
})

onTab("Customize Theme (Coming Soon!)", async () => {
  await arg("Nothing to see here")
})

onTab("Account__", async () => {
  await arg("Nothing to see here")
})
