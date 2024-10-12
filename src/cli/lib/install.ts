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

  if (!isYarn) {
    // Check if the package manager exists with or without .exe extension
    const pm = packageManager + (global.isWin ? ".exe" : "")
    if (existsSync(kitPnpmPath(pm))) {
      // Use the full path to the package manager, but without the .exe extension
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
