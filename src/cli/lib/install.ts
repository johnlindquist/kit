import { kitPnpmPath } from "../../core/resolvers.js"
import { existsSync } from "node:fs"
export async function createPackageManagerCommand(
  command: "i" | "un",
  packageNames: string[]
) {
  let isYarn = await isFile(kenvPath("yarn.lock"))

  let packageManager = isYarn ? "yarn" : "pnpm"
  let toolCommand = command as
    | "add"
    | "i"
    | "remove"
    | "uninstall"

  if (isYarn) {
    if (command === "i") {
      toolCommand = "add"
    }
  }

  // Add .cmd extension for Windows
  if (global.isWin) {
    packageManager += ".exe"
  }

  if (!isYarn) {
    if (existsSync(kitPnpmPath(packageManager))) {
      packageManager = kitPnpmPath(packageManager)
    }
  }

  // Combine package manager and command
  let installCommand = `${packageManager} ${command}`

  let packages = packageNames.join(" ")
  let fullCommand =
    `${installCommand} -D ${packages}`.trim()

  return fullCommand
}
