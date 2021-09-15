import {
  readdir,
  rename,
  readFile,
  writeFile,
} from "fs/promises"
import path from "path"

let outDir = path.resolve(process.env.KIT, "cjs")

let files = await readdir(outDir)

for await (let file of files) {
  let filePath = `${outDir}/${file}`
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
