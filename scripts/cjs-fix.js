import {
  readdir,
  rename,
  readFile,
  writeFile,
  rm,
} from "fs/promises"
import { copy } from "fs-extra"
import path from "path"

console.log(`Fixing cjs and moving to ./core ...`)

let cjsDir = path.resolve(process.env.KIT, "cjs")
let coreDir = path.resolve(process.env.KIT, "core")

let files = await readdir(cjsDir)

for await (let file of files) {
  let filePath = `${cjsDir}/${file}`
  let content = await readFile(filePath, "utf-8")
  content = content.replace(
    /(?<=require\(".*)\.js(?!=")/g,
    ".cjs"
  )

  content = content.replace(
    /Promise\.resolve\(\)\.then\(\(\) => __importStar\(require\("(.*)"\)\)\)/g,
    `import("$1")`
  )

  await writeFile(filePath, content)
  await rename(filePath, filePath.replace(".js", ".cjs"))
}
await copy(cjsDir, coreDir, { overwrite: true })
await rm(cjsDir, { force: true, recursive: true })
