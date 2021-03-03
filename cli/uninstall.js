let file = JSON.parse(
  await readFile(kenvPath("package.json"), {
    encoding: "utf8",
  })
)

let packages = await arg(
  chalk`Which packages do you want to {red uninstall}`,
  [
    ...Object.keys(file?.dependencies || []),
    ...Object.keys(file?.devDependencies || []),
  ]
)

//grab all the args you used `kit un jquery react`
if (typeof packages == "string") {
  packages = [packages, ...args]
}

let uninstall = spawn(
  kitPath("node", "bin", "npm"),
  [
    "uninstall",
    "--prefix",
    kenvPath(),
    ...packages,
    ...args,
  ],
  {
    stdio: "inherit",
    cwd: env.KENV,
    env: {
      //need to prioritize our node over any nodes on the path
      PATH: kitPath("node", "bin") + ":" + env.PATH,
    },
  }
)

uninstall.on("error", error => {
  console.log({ error })
})
