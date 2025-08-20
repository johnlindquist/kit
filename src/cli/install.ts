import {
  formatDistanceToNow,
  parseISO,
} from "../utils/date.js"
import { getKenvFromPath, KIT_FIRST_PATH } from "../core/utils.js"
import { createPackageManagerCommand } from "./lib/install.js"
import { stat, readlink } from "node:fs/promises"

let install = async (packageNames: string[]) => {
  let cwd = (global.installCwd || kenvPath()) as string

  if (global?.errorScriptPath) {
    try {
      const kenv = getKenvFromPath(global.errorScriptPath)
      if (kenv) {
        const kenvDir = kenvPath("kenvs", kenv)
        const stats = await stat(kenvDir)
        if (stats.isDirectory() || (stats.isSymbolicLink() && (await stat(await readlink(kenvDir))).isDirectory())) {
          cwd = kenvPath("kenvs", kenv)
        }
      }
    } catch (e) {

    }
  }

  // if (process.env.SCRIPTS_DIR) {
  // 	cwd = kenvPath(process.env.SCRIPTS_DIR)
  // }
  let command = await createPackageManagerCommand(
    "i",
    packageNames
  )

  return await term({
    name: "pnpm install",
    command,
    env: {
      ...global.env,
      PATH: KIT_FIRST_PATH,
      DISABLE_AUTO_UPDATE: "true", // Disable auto-update for zsh
    },
    cwd,
  })
}

if (!global.confirmedPackages) {
  let packages = await arg(
    {
      enter: "Install",
      debounceInput: 1000,
      hint: 'Note: npm search is debounced 1 second to avoid rate limiting',
      placeholder:
        "Which npm package would you like to install?",
    },
    async input => {
      if (!input || input?.length < 3) {
        return [
          {
            info: true,
            miss: true,
            name: 'Search for npm packages',
          },
        ]
      }
      type pkgs = {
        objects: {
          package: {
            name: string
            description: string
            date: string
          }
        }[]
      }
      try {
        let response = await get<pkgs>(
          `http://registry.npmjs.com/-/v1/search?text=${input}&size=20`
        )
        let packages = response.data.objects
        return packages.map(o => {
          return {
            name: o.package.name,
            value: o.package.name,
            description: `${o.package.description
              } - ${formatDistanceToNow(
                parseISO(o.package.date)
              )} ago`,
          }
        })
      } catch (error) {
        console.error('Error searching npm registry:', error.message || error)
        return [
          {
            info: true,
            miss: true,
            name: `Error: ${error.message || 'Failed to search npm packages'}`,
            description: 'Please try again or install manually',
          }
        ]
      }
    }
  )

  global.confirmedPackages ||= [packages]
}

if (process?.send) global.setChoices([])
// Only pass confirmed package names to the installer. Avoid forwarding
// arbitrary process args (e.g., AVA flags like --concurrency) which can
// break package manager commands in CI, especially on Windows.
await install([...global.confirmedPackages])
const packages = global.confirmedPackages
export { packages }
