let { createSourceFilePath, createBinFile } = await import(
  "./utils.js"
)

export let copyScript = async (source, target) => {
  //TODO: not finding my `g` git alias
  let result = exec(`type ${target}`, {
    silent: true,
  })
  if (result.stdout) {
    console.log(`${target} already exists. 
  ${result.stdout.trim()}
  Please pick a different name...`)
    spawn("simple", ["cp", source], { stdio: "inherit" })
    return
  }

  const newSrcFilePath = path.join(
    process.env.SIMPLE_SRC_PATH,
    target + ".js"
  )

  const sourceFilePath = createSourceFilePath(source)
  cp(sourceFilePath, newSrcFilePath)
  await createBinFile(target)

  edit(newSrcFilePath, process.env.SIMPLE_PATH)
}
