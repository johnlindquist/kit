// Name: npm
// Description: Add/remove npm packages
// Keyword: npm

import { CLI } from "../cli"
import { cliShortcuts } from "../core/utils.js"

while (true) {
  let script = await arg(
    {
      inputRegex: arg?.keyword
        ? `(?<=${arg?.keyword}\\s)(.*)`
        : "",
      placeholder: "What would you like to do?",
      shortcuts: cliShortcuts,
      enter: "Select",
    },
    [
      { name: "Install an npm package", value: "install" },
      {
        name: "Update an npm package",
        value: "update-package",
      },
      {
        name: "Uninstall an npm package",
        value: "uninstall",
      },
      {
        name: "Get more info about an npm packaage",
        value: "more-info",
      },
      {
        name: "Open a Terminal to Manually Install/Uninstall",
        value: "manual-npm",
      },
    ]
  )

  setInput("")
  setFilterInput("")

  await cli(script as keyof CLI)
}

export {}
