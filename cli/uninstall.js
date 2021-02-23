let file = JSON.parse(
  await readFile(simplePath("package.json"), {
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

//grab all the args you used `simple un jquery react`
if (typeof packages == "string") {
  packages = [packages, ...args]
}

let uninstall = spawn(
  "npm",
  [
    "uninstall",
    "--prefix",
    simplePath(),
    ...packages,
    ...args,
  ],
  {
    stdio: "inherit",
    cwd: env.SIMPLE_PATH,
    env: {
      //need to prioritize our node over any nodes on the path
      PATH: sdkPath("node", "bin") + ":" + env.PATH,
    },
  }
)

uninstall.on("error", error => {
  console.log({ error })
})
