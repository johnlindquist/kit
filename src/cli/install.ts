import { KIT_NODE_PATH } from "../core/utils.js"

import {
  formatDistanceToNow,
  parseISO,
} from "@johnlindquist/kit-internal/date-fns"

let install = async packageNames => {
  let isYarn = await isFile(kenvPath("yarn.lock"))
  let [tool, command] = (
    isYarn ? `yarn add` : `npm i`
  ).split(" ")
  return await new Promise((res, rej) => {
    console.log(tool, command, ...packageNames)
    let PATH =
      KIT_NODE_PATH + path.delimiter + process.env.PATH
    let npm = spawn(
      tool,
      [command, "--quiet", ...packageNames],
      {
        stdio: "pipe",
        cwd: kenvPath(),
        env: {
          PATH,
        },
      }
    )

    npm.on("error", error => {
      console.log({ error })
      rej(error)
    })

    npm.on("exit", exit => {
      console.log(`Installed ${packageNames}`)
      res(exit)
    })
  })
}

let packages = await arg(
  "Which npm package/s would you like to install?",
  async input => {
    if (input.length < 3) return []
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
global.setChoices([])
await install([...installNames, ...argOpts])

export { packages }
