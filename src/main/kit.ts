// Name: Manage Kit
// Description: Options and Helpers

import { Choice } from "../types/core"
import { CLI } from "../cli"

import { kitMode, run } from "../core/utils.js"
import { addPreview, findDoc } from "../cli/lib/utils.js"

setFlags({
  discuss: {
    name: "Discuss topic on Kit Dicussions",
    description: "Open discussion in browser",
  },
})

let kitManagementChoices: Choice<keyof CLI>[] = [
  {
    name: "Manage kenvs",
    description: "Add/Remove/Update repos of scripts",
    value: "kenv-manage",
  },

  {
    name: "Settings",
    description: "Open settings/preferences",
    value: "settings",
  },
  {
    name: "View schedule",
    description: "View and edit upcoming jobs",
    value: "schedule",
  },
  {
    name: "System Scripts",
    description: "View and edit system event scripts",
    value: "system-events",
  },

  {
    name: "Add ~/.kit/bin to $PATH",
    description: `Looks for your profile and appends to $PATH`,
    value: "add-kit-to-profile",
  },
  {
    name: "Add kenv bin to $PATH",
    description: `Select a kenv bin dir to append profile $PATH`,
    value: "add-kenv-to-profile",
  },
  {
    name: "Change App Shortcut",
    description:
      "Pick a new keyboard shortcut for the main menu",
    value: "change-main-shortcut",
  },
  {
    name: "Change Script Shortcut",
    description:
      "Pick a new keyboard shortcut for a script",
    value: "change-shortcut",
  },
  {
    name: "Generate bin Files",
    description: "Recreate all the terminal executables",
    value: "create-all-bins",
  },

  {
    name: "Change Editor",
    description: "Pick a new editor",
    value: "change-editor",
  },
  {
    name: "Clear Kit Prompt Cache",
    description: "Reset prompt position and sizes",
    value: "kit-clear-prompt",
  },
  {
    name: "Manage npm packages",
    description: `add or remove npm package`,
    value: "manage-npm",
  },
  kitMode() === "ts"
    ? {
        name: "Switch to JavaScript Mode",
        description: "Sets .env KIT_MODE=js",
        value: "switch-to-js",
      }
    : {
        name: "Switch to TypeScript mode",
        description: "Sets .env KIT_MODE=ts",
        value: "switch-to-ts",
      },
  {
    name: "Sync $PATH from Terminal to Kit.app",
    description: "Set .env PATH to the terminal $PATH",
    value: "sync-path-instructions",
  },
  {
    name: "Update Kit.app",
    description: `Version: ${env.KIT_APP_VERSION}`,
    value: "update",
  },
  {
    name: "Open kit.log",
    description: `Open ~/.kit/logs/kit.log in ${env.KIT_EDITOR}`,
    value: "kit-log",
    preview: async () => {
      let logFile = await readFile(
        kitPath("logs", "kit.log"),
        "utf-8"
      )

      return `
      <div class="prose dark:prose-dark">      
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
</div>
      `
    },
  },
  {
    name: "Credits",
    description: `The wonderful people who make Script Kit`,
    value: "credits",
    img: kitPath("images", "icon.png"),
  },
  {
    name: "Quit",
    description: `Quit Script Kit`,
    value: "quit",
  },
]

let noChoices = false
let onNoChoices = async input => {
  noChoices = true
  setPreview(
    md(`

# No Options Found for "${input}"

Ask a question on our [GitHub Discussions](https://github.com/johnlindquist/kit/discussions/categories/q-a).
`)
  )
}
let onChoices = async input => {
  noChoices = false
}

let cliScript = await arg(
  {
    placeholder: `Kit Options`,
    strict: false,
    onChoices,
    onNoChoices,
    input: arg?.input || "",
  },
  await addPreview(kitManagementChoices, "kit", true)
)

if (noChoices) {
  exec(
    `open 'https://github.com/johnlindquist/kit/discussions/categories/q-a'`
  )
} else if (flag?.discuss) {
  let doc = await findDoc("kit", cliScript)
  if (doc?.discussion) {
    exec(`open "${doc.discussion}"`)
  }
} else {
  await run(kitPath("cli", cliScript) + ".js")
}

export {}
