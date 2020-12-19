let {
  createSourceFilePath,
  createBinFilePath,
} = await import("./utils.js")

export let removeScript = async name => {
  await trash([
    createBinFilePath(name),
    createSourceFilePath(name),
  ])

  echo(`Removed script: ` + chalk.green.bold(name))
}
