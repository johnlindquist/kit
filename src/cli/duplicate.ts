// Description: Duplicate the selected script

import { exists, stripMetadata } from "../core/utils.js"
import { generate } from "@johnlindquist/kit-internal/project-name-generator"

let examples = Array.from({ length: 3 })
  .map((_, i) => generate({ words: 2 }).dashed)
  .join(", ")

let { filePath } = await selectScript(
  "Select Script to Duplicate"
)

// TODO: Consider Using the "info" approach

setDescription(`Duplicate ${filePath}`)
let newCommand = await arg(
  {
    placeholder: `Enter name for new script`,
    validate: exists,
    strict: false,
  },
  [
    {
      info: "always",
      name: `Requirements: lowercase, dashed, no extension`,
      description: `Examples: ${examples}`,
    },
  ]
)

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
