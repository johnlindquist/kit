// Menu: Manage npm
// Description: Add/remove npm packages

import { CLI } from "cli"

while (true) {
  let script = await arg("Manage npm packages", [
    { name: "Install", value: "install" },
    { name: "Uninstall", value: "uninstall" },
    { name: "More Info", value: "more-info" },
  ])

  await cli(script as keyof CLI)
}

export {}
