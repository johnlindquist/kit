let scriptPath = await arg("Enter script path name:")

let binTemplate = await readFile(
  env.SIMPLE_BIN_TEMPLATE_PATH,
  "utf8"
)

let pathParts = scriptPath.replace(".js", "").split("/")
let [type, name] = pathParts.slice(pathParts.length - 2)

binTemplate = compile(binTemplate)
binTemplate = binTemplate({ name, type, ...env })

let binFilePath = path.join(env.SIMPLE_BIN_PATH, name)
await writeFile(binFilePath, binTemplate)
chmod(755, binFilePath)
