let scriptPath = await arg("Enter script path name:")
let binTemplate = await readFile(
  sdkPath("templates", "bin", "template"),
  "utf8"
)

let pathParts = scriptPath.replace(".js", "").split("/")
let [type, name] = pathParts.slice(pathParts.length - 2)

binTemplate = compile(binTemplate)
binTemplate = binTemplate({
  name,
  type,
  ...env,
  TARGET_PATH: simplePath(),
})

let binFilePath = simplePath("bin", name)
await writeFile(binFilePath, binTemplate)
chmod(755, binFilePath)
