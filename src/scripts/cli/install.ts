/** @type typeof import("date-fns") */
let { formatDistanceToNow, parseISO } = await npm(
  "date-fns"
)

let install = async packageNames => {
  return await new Promise((res, rej) => {
    let npm = spawn(
      kitPath("node", "bin", "npm"),
      ["i", "--prefix", kenvPath(), ...packageNames],
      {
        stdio: "inherit",
        cwd: kenvPath(),
        env: {
          //need to prioritize our node over any nodes on the path
          PATH: kitPath("node", "bin") + ":" + env.PATH,
        },
      }
    )

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

let installNames = [...packageNames.split(" "), ...args]

await install([...installNames, ...argOpts])

export {}
