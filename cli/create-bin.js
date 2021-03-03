let type = await arg("Select type:", ["scripts", "cli"])
let name = await arg("Script name:")

let binTemplate = await readFile(
  kitPath("templates", "bin", "template"),
  "utf8"
)

binTemplate = compile(binTemplate)
binTemplate = binTemplate({
  name,
  type,
  ...env,
  TARGET_PATH: kenvPath(),
})

let binFilePath = kenvPath("bin", name)

mkdir("-p", path.dirname(binFilePath))
await writeFile(binFilePath, binTemplate)
chmod(755, binFilePath)
