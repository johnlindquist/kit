import { KIT_NODE_PATH } from "../core/utils.js"

let { formatDistanceToNow, parseISO } = (await npm(
  "date-fns"
)) as typeof import("date-fns")

let install = async packageNames => {
  let isYarn = await isFile(kenvPath("yarn.lock"))
  let [tool, command] = (
    isYarn ? `yarn add` : `npm i`
  ).split(" ")
  return await new Promise((res, rej) => {
    console.log(tool, command, ...packageNames)
    let npm = spawn(
      tool,
      [command, "--loglevel", "verbose", ...packageNames],
      {
        stdio: "pipe",
        cwd: kenvPath(),
        env: {
          PATH: KIT_NODE_PATH,
        },
      }
    )

    if (npm?.stdout) {
      npm.stdout.on("data", data => {
        let line = data?.toString()
        console.log(line)
        if (global.setHint) global.setHint(line)
      })
    }

    npm.on("error", error => {
      console.log({ error })
      rej(error)
    })

    npm.on("exit", exit => {
      res(exit)
    })
  })
}

let packageNames = await arg(
  "Which npm package/s would you like to install?",
  async input => {
    if (input.length < 3) return []
    let response = await get(
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

let installNames = [...packageNames.split(" ")]

await install([...installNames, ...argOpts])

export {}
