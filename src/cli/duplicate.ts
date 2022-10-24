// Description: Duplicate the selected script

import { exists } from "../core/utils.js"
import { generate } from "@johnlindquist/kit-internal/project-name-generator"

let examples = Array.from({ length: 3 })
  .map((_, i) => generate({ words: 2 }).dashed)
  .join(", ")

import { stripMetadata } from "../core/utils.js"

let { filePath } = await selectScript(
  "Select Script to Duplicate"
)

let newCommand = await arg({
  placeholder: `Enter name for new script`,
  selected: filePath,
  footer: `e.g., <span class="pl-2 font-mono">${examples}</span>`,
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

let newContent = stripMetadata(oldContent, [
  "Author",
  "Twitter",
  "Alias",
  "Description",
])
await writeFile(newFilePath, newContent)

await cli("create-bin", "scripts", newFilePath)

await run(kitPath("cli", "edit-script.js"), newFilePath)

export {}
