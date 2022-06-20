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
let binTemplate = await readFile(
  kitPath("templates", "bin", template),
  "utf8"
)

let binTemplateCompiler = compile(binTemplate)

for await (let { command, filePath } of scripts) {
  let compiledBinTemplate = binTemplateCompiler({
    command,
    type: "scripts",
    KNODE: knodePath(),
    KIT: kitPath(),
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
  await global.writeFile(binFilePath, compiledBinTemplate)
  global.chmod(755, binFilePath)
}

export {}
