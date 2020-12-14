let {
  createSourceFilePath,
  createBinFilePath,
} = await import("./utils.js")

export let removeScript = async name => {
  rm(createBinFilePath(name))
  rm(createSourceFilePath(name))
  echo(`Removed script: ` + chalk.green.bold(name))
}
