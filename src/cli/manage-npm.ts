// Name: Manage npm
// Description: Add/remove npm packages

import { CLI } from "../cli"

while (true) {
  let script = await arg(
    {
      placeholder: "What would you like to do?",
    },
    [
      { name: "Install an npm package", value: "install" },
      {
        name: "Uninstall an npm package",
        value: "uninstall",
      },
      {
        name: "Get more info about an npm packaage",
        value: "more-info",
      },
    ]
  )

  await cli(script as keyof CLI)
}

export {}
