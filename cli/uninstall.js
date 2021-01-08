let file = JSON.parse(
  await readFile(
    path.join(env.SIMPLE_PATH, "package.json"),
    { encoding: "utf8" }
  )
)

let packages = await arg(
  chalk`Which packages do you want to {red uninstall}`,
  {
    type: "autocomplete",
    multiple: true,
    choices: [
      ...Object.keys(file?.dependencies || []),
      ...Object.keys(file?.devDependencies || []),
    ],
  }
)

//grab all the args you used `simple un jquery react`
if (typeof packages == "string") {
  packages = [packages, ...args]
}

spawn(env.SIMPLE_NPM, ["uninstall", ...packages, ...args], {
  stdio: "inherit",
})
