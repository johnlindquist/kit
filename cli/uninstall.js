let file = JSON.parse(
  await readFile(
    path.join(env.SIMPLE_PATH, "package.json"),
    { encoding: "utf8" }
  )
)

const packages = await arg(
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

spawn(env.SIMPLE_NPM, ["uninstall", ...packages, ...args], {
  stdio: "inherit",
})
