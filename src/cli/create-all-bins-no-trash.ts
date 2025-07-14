import { getScripts } from "../core/db.js"
import { getKenvs } from "../core/utils.js"

let scripts = await getScripts(false)

let kenvs = await getKenvs()

log(`🔎 Found kenvs`, kenvs)

await ensureDir(kenvPath("bin"))

for await (let kenv of kenvs) {
  await ensureDir(path.resolve(kenv, "bin"))
}

let jsh = process.env?.SHELL?.includes("jsh")
let template = jsh ? "stackblitz" : "terminal"
let useCmd =
  process.platform === "win32" && !process.env?.KIT_WSL

if (useCmd) {
  template = "cmd"
}
let binTemplate = await readFile(
  kitPath("templates", "bin", template),
  "utf8"
)

let binTemplateCompiler = compile(binTemplate)

try {
  for await (let { command, filePath, bin } of scripts) {
    if (!bin) {
      continue
    }
    let compiledBinTemplate = binTemplateCompiler({
      command,
      type: "scripts",
      KIT: kitPath(),
      KIT_NODE_PATH: process.env.KIT_NODE_PATH,
      ...global.env,
      TARGET_PATH: filePath,
    })

    let binDirPath = path.resolve(
      filePath,
      "..",
      "..",
      ...(jsh ? ["node_modules", ".bin"] : ["bin"])
    )
    let binFilePath = path.resolve(binDirPath, command)
    if (useCmd) {
      binFilePath += ".cmd"
    }
    await global.writeFile(binFilePath, compiledBinTemplate)
    global.chmod(755, binFilePath)
  }
} catch (error) {
  log(`🚨 Error creating bins`, error)
}

export { }
