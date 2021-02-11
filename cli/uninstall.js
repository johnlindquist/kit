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

spawn(env.SIMPLE_NPM, ["uninstall", ...packages, ...args], {
  stdio: "inherit",
  cwd: env.SIMPLE_PATH,
  env: {
    //need to prioritize our node over any nodes on the path
    PATH: env.SIMPLE_NODE_BIN + ":" + env.PATH,
  },
})
