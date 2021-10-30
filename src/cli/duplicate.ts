// Description: Duplicate the selected script

import { exists } from "../core/utils.js"
import { generate } from "@johnlindquist/kit-internal/project-name-generator"

let examples = Array.from({ length: 3 })
  .map((_, i) => generate({ words: 2 }).dashed)
  .join(", ")

import { stripMetadata } from "../core/utils.js"

let { filePath } = await selectScript(
  `Which script do you want to duplicate?`
)

let newCommand = await arg({
  placeholder: `Enter name for new script`,
  selected: filePath,
  hint: `examples: ${examples}`,
  validate: exists,
})

if (!(await isFile(filePath))) {
  console.warn(`${filePath} doesn't exist...`)
  exit()
}

let { dirPath: selectedKenvDir } = await selectKenv()

let newFilePath = path.join(
  selectedKenvDir,
  "scripts",
  newCommand + path.extname(filePath)
)
let oldContent = await readFile(filePath, "utf-8")

let newContent = stripMetadata(oldContent)
await writeFile(newFilePath, newContent)

await cli("create-bin", "scripts", newFilePath)

edit(newFilePath, kenvPath())

export {}
