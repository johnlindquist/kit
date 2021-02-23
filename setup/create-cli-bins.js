let binTemplate = await readFile(
  sdkPath("templates", "bin", "template"),
  "utf8"
)

let binCompiler = compile(binTemplate)

let bins = ["cli/new", "cli/edit", "cli/simple"]

bins.forEach(async bin => {
  let [type, name] = bin.split("/")
  let binResult = binCompiler({
    name,
    type,
    ...env,
    TARGET_PATH: sdkPath(),
  })

  let binFilePath = simplePath("bin", name)
  await writeFile(binFilePath, binResult)
  chmod(755, binFilePath)
})
