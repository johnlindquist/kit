// Name: Manage npm
// Description: Add/remove npm packages

import { CLI } from "../cli"

let hint = ``
while (true) {
  let script = await arg(
    {
      placeholder: "Manage npm packages",
      hint,
    },
    [
      { name: "Install", value: "install" },
      { name: "Uninstall", value: "uninstall" },
      { name: "More Info", value: "more-info" },
    ]
  )

  let { packages } = await cli(script as keyof CLI)
  hint =
    script === "more-info" ? "" : `${script}ed ${packages}`
}

export {}
