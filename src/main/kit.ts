// Menu: Manage Kit
// Description: Options and Helpers

import { Choice } from "../core/type.js"
import { getKenvs } from "../core/utils.js"
import { CLI } from "cli"

let kitManagementChoices: Choice<keyof CLI>[] = [
  {
    name: "Clone repo of scripts",
    description: `Clone a repo of scripts (AKA kenv)`,
    value: "kenv-clone",
  },
  {
    name: "Create a repo of scripts",
    description: `Create a kenv dir to share`,
    value: "kenv-create",
  },
  {
    name: "Add existing local kenv",
    description: "Add a kenv from your hard drive",
    value: "kenv-add",
  },
  {
    name: "Open kit.log",
    description: `Open ~/.kit/logs/kit.log in ${env.KIT_EDITOR}`,
    value: "kit-log",
  },
  {
    name: "Update Kit.app",
    description: `Version: ${env.KIT_APP_VERSION}`,
    value: "update",
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
    name: "Open Script Kit at Login",
    description: "Open toggle login at launch at login",
    value: "open-at-login",
  },

  {
    name: "Add ~/.kit/bin to $PATH",
    description: `Looks for your profile and appends to $PATH`,
    value: "add-kit-to-profile",
  },
  {
    name: "Add ~/.kenv/bin to $PATH",
    description: `Looks for your profile and appends ${kenvPath()} to $PATH`,
    value: "add-kenv-to-profile",
  },
  {
    name: "Change main keyboard shortcut",
    description:
      "Pick a new keyboard shortcut for the main menu",
    value: "change-main-shortcut",
  },
  {
    name: "Change script shortcut",
    description:
      "Pick a new keyboard shortcut for a script",
    value: "change-shortcut",
  },
  {
    name: "Generate bin files",
    description: "Recreate all the terminal executables",
    value: "create-all-bins",
  },

  {
    name: "Change editor",
    description: "Pick a new editor",
    value: "change-editor",
  },
  {
    name: "Clear Kit prompt cache",
    description: "Reset prompt position and sizes",
    value: "kit-clear-prompt",
  },
  {
    name: "Manage npm packages",
    description: `add or remove npm package`,
    value: "manage-npm",
  },
  {
    name: "Prepare Script for Stream Deck",
    description:
      "Launch a script from a Stream Deck button",
    value: "stream-deck",
  },
  {
    name: "Created by John Lindquist",
    description: `Follow @johnlindquist on twitter`,
    value: "credits",
    img: kitPath("images", "john.png"),
  },
  {
    name: "Quit",
    description: `Quit Script Kit`,
    value: "quit",
  },
]

if ((await getKenvs()).length) {
  kitManagementChoices.splice(-3, 0, {
    name: "View kenv",
    description: `View scripts from specified kenv`,
    value: "kenv-view",
  })
  kitManagementChoices.splice(-3, 0, {
    name: `Remove kenv`,
    description: `Remove a kenv`,
    value: "kenv-rm",
  })
  kitManagementChoices.splice(-3, 0, {
    name: `Push kenv`,
    description: `Runs git push on kenv repo`,
    value: "kenv-push",
  })
  kitManagementChoices.splice(-3, 0, {
    name: `Pull kenv`,
    description: `Runs git pull on kenv repo`,
    value: "kenv-pull",
  })
}

let cliScript = await arg(
  `Kit Options`,
  kitManagementChoices
)

await run(kitPath("cli", cliScript) + ".js")

export {}
