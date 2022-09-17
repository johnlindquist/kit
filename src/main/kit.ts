// Name: Manage Kit
// Description: Options and Helpers

import { Choice } from "../types/core"
import { kitMode, run } from "../core/utils.js"
import { getDocs } from "../cli/lib/utils.js"

let docs = await getDocs()
let containerClasses = "p-5 prose dark:prose-dark prose-sm"
let createPreview =
  (dir: string, file: string) => async () => {
    try {
      let doc = docs.find(
        d => d.dir === dir && d.file === file
      )
      return await highlight(doc.content, containerClasses)
    } catch (error) {
      return `Preview not found for ${dir}/${file}`
    }
  }

let kitChoices: Choice<string>[] = [
  {
    name: "Get Help",
    description: `Post a question to Script Kit GitHub discussions`,
    value: kitPath("cli", "get-help.js"),
    enter: "Open Script Kit Discussions",
    preview: createPreview("help", "get-help"),
  },
  {
    name: "Subscribe to Newsletter",
    description: `Receive a newsletter with examples and tips`,
    value: kitPath("help", "join.js"),
    preview: createPreview("help", "join"),
    enter: "Subscribe",
  },
  {
    name: "Script Kit FAQ",
    description: `Frequently asked questions`,
    value: kitPath("help", "faq.js"),
    enter: "Open Script Kit FAQ",
    preview: createPreview("help", "faq"),
  },
  {
    name: "View Schedule",
    description: "View and edit upcoming jobs",
    value: kitPath("cli", "schedule.js"),
    preview: createPreview("help", "schedule"),
  },
  {
    name: "System Scripts",
    description: "View and edit system event scripts",
    value: kitPath("cli", "system-events.js"),
    preview: createPreview("kit", "system-events"),
  },

  {
    name: "Manage kenvs",
    description: "Add/Remove/Update repos of scripts",
    value: kitPath("cli", "kenv-manage.js"),
    preview: createPreview("kit", "kenv-manage"),
  },

  {
    name: "Add ~/.kit/bin to $PATH",
    description: `Looks for your profile and appends to $PATH`,
    value: kitPath("cli", "add-kit-to-profile.js"),
    preview: createPreview("kit", "add-kit-to-profile"),
  },
  {
    name: "Add kenv bin to $PATH",
    description: `Select a kenv bin dir to append profile $PATH`,
    value: kitPath("cli", "add-kenv-to-profile.js"),
    preview: createPreview("kit", "add-kenv-to-profile"),
  },
  {
    name: "Change App Shortcut",
    description:
      "Pick a new keyboard shortcut for the main menu",
    value: kitPath("cli", "change-main-shortcut.js"),
    preview: createPreview("kit", "change-main-shortcut"),
  },
  {
    name: "Change Script Shortcut",
    description:
      "Pick a new keyboard shortcut for a script",
    value: kitPath("cli", "change-shortcut.js"),
    preview: createPreview("kit", "change-shortcut"),
  },
  {
    name: "Generate bin Files",
    description: "Recreate all the terminal executables",
    value: kitPath("cli", "create-all-bins.js"),
    preview: createPreview("kit", "create-all-bins"),
  },

  {
    name: "Change Editor",
    description: "Pick a new editor",
    value: kitPath("cli", "change-editor.js"),
    preview: createPreview("kit", "change-editor"),
  },
  {
    name: "Clear Kit Prompt Cache",
    description: "Reset prompt position and sizes",
    value: kitPath("cli", "kit-clear-prompt.js"),
    preview: createPreview("kit", "kit-clear-prompt"),
  },
  {
    name: "Manage npm packages",
    description: `add or remove npm package`,
    value: kitPath("cli", "manage-npm.js"),
    preview: createPreview("kit", "manage-npm"),
  },
  kitMode() === "ts"
    ? {
        name: "Switch to JavaScript Mode",
        description: "Sets .env KIT_MODE=js",
        value: kitPath("cli", "switch-to-js.js"),
        preview: createPreview("kit", "switch-to-js"),
      }
    : {
        name: "Switch to TypeScript mode",
        description: "Sets .env KIT_MODE=ts",
        value: kitPath("cli", "switch-to-ts.js"),
        preview: createPreview("kit", "switch-to-ts"),
      },
  {
    name: "Sync $PATH from Terminal to Kit.app",
    description: "Set .env PATH to the terminal $PATH",
    value: kitPath("cli", "sync-path-instructions.js"),
    preview: createPreview("kit", "sync-path-instructions"),
  },
  {
    name: "Update Kit.app",
    description: `Version: ${env.KIT_APP_VERSION}`,
    value: kitPath("cli", "update.js"),
    preview: createPreview("kit", "update"),
  },
  {
    name: "Open kit.log",
    description: `Open ~/.kit/logs/kit.log in ${env.KIT_EDITOR}`,
    value: kitPath("cli", "kit-log.js"),
    preview: async () => {
      let logFile = await readFile(
        kitPath("logs", "kit.log"),
        "utf-8"
      )

      return `
      
${md(`# Latest 100 Log Lines`)}
<div class="text-xxs font-mono whitespace-nowrap">      
      ${logFile
        .split("\n")
        .map(line =>
          line
            .replace(/[^\s]+?(?=\s\d)\s/, "[")
            .replace("    ", "&emsp;")
            .replace("  ", "&ensp;")
        )
        .slice(-100)
        .reverse()
        .join("<br>")}
</div>

      `
    },
  },
  // {
  //   name: "View Editor History",
  //   description: "View editor history",
  //   value: kitPath("cli", "editor-history.js"),
  // },
  {
    name: "Edit .env",
    description: `Open ~/.kenv/.env in ${env.KIT_EDITOR}`,
    value: kitPath("cli", "env.js"),
  },
  {
    name: "Settings",
    description: "Open settings/preferences",
    value: kitPath("cli", "settings.js"),
    enter: "Open app.json",
    preview: createPreview("kit", "settings"),
  },
  {
    name: "Update API and Guide",
    description: `Download latest version of API.md and GUIDE.md`,
    value: "download-md",
  },
  {
    name: "Credits",
    description: `The wonderful people who make Script Kit`,
    value: kitPath("cli", "credits.js"),
    enter: "View @johnlindquist on Twitter",
    preview: createPreview("kit", "credits"),
    // img: kitPath("images", "icon.png"),
  },
  {
    name: "Quit",
    description: `Quit Script Kit`,
    value: kitPath("cli", "quit.js"),
    enter: "Quit",
    preview: createPreview("kit", "quit"),
  },
]

let hasChoices = true

let onNoChoices = async (input: string) => {
  hasChoices = false
  setPanel(
    md(`# No Options Found for "${input}"
    
  Ask a question on our [GitHub Discussions](https://github.com/johnlindquist/kit/discussions/categories/q-a).`)
  )
}

let scriptPath = await arg(
  {
    placeholder: `Kit Options`,
    strict: false,
    input: arg?.input || "",
    onNoChoices,
    onChoiceFocus: () => {
      hasChoices = true
    },
    shortcuts: [],
    enter: "Select",
  },
  kitChoices
)

if (!hasChoices) {
  browse(
    `https://github.com/johnlindquist/kit/discussions/categories/q-a`
  )
} else {
  if (await isFile(scriptPath)) {
    await run(scriptPath)
  }
}

export {}
