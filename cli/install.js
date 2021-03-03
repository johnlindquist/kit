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
  "Which npm package/s would you like to install?"
)

let installNames = [...packageNames.split(" "), ...args]

await install([...installNames, ...argOpts])
