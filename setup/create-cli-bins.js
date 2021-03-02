let binTemplate = await readFile(
  kitPath("templates", "bin", "template"),
  "utf8"
)

let binCompiler = compile(binTemplate)

let bins = ["cli/new", "cli/edit", "cli/kit"]

bins.forEach(async bin => {
  let [type, name] = bin.split("/")
  let binResult = binCompiler({
    name,
    type,
    ...env,
    TARGET_PATH: kitPath(),
  })

  let binFilePath = projectPath("bin", name)
  await writeFile(binFilePath, binResult)
  chmod(755, binFilePath)
})
