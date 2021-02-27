let install = async packageNames => {
  return await new Promise((res, rej) => {
    let npm = spawn(
      sdkPath("node", "bin", "npm"),
      ["i", "--prefix", simplePath(), ...packageNames],
      {
        stdio: "inherit",
        cwd: simplePath(),
        env: {
          //need to prioritize our node over any nodes on the path
          PATH: sdkPath("node", "bin") + ":" + env.PATH,
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
