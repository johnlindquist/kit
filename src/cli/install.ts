import {
  formatDistanceToNow,
  parseISO,
} from "date-fns"
import { KIT_FIRST_PATH } from "../core/utils.js"
import { createPackageManagerCommand } from "./lib/install.js"

let install = async (packageNames: string[]) => {
  let cwd = kenvPath()

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

let packages = await arg(
  {
    enter: "Install",
    placeholder:
      "Which npm package/s would you like to install?",
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
    let response = await get<pkgs>(
      `http://registry.npmjs.com/-/v1/search?text=${input}&size=20`
    )
    let packages = response.data.objects
    return packages.map(o => {
      return {
        name: o.package.name,
        value: o.package.name,
        description: `${
          o.package.description
        } - ${formatDistanceToNow(
          parseISO(o.package.date)
        )} ago`,
      }
    })
  }
)

let installNames = [...packages.split(" ")]
if (process?.send) global.setChoices([])

await install([...installNames, ...argOpts])

export { packages }
