// Description: Duplicate the selected script

import { exists } from "../utils.js"
let generate = await npm("project-name-generator")

let examples = Array.from({ length: 3 })
  .map((_, i) => generate({ words: 2 }).dashed)
  .join(", ")

import { stripMetadata } from "@core/util"
import { selectScript } from "../utils.js"

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

let kenvDirs = (await readdir(kenvPath("kenvs"))) || []

let selectedKenvDir = kenvPath()

selectedKenvDir = await arg(`Select target kenv`, [
  {
    name: "home",
    description: `Your main kenv: ${kenvPath()}`,
    value: kenvPath(),
  },
  ...kenvDirs.map(kenvDir => {
    let value = kenvPath("kenvs", kenvDir)
    return {
      name: kenvDir,
      description: value,
      value,
    }
  }),
])

let newFilePath = path.join(
  selectedKenvDir,
  "scripts",
  newCommand + (newCommand.endsWith(".js") ? "" : ".js")
)
let oldContent = await readFile(filePath, "utf-8")

let newContent = stripMetadata(oldContent)
await writeFile(newFilePath, newContent)

await cli("create-bin", "scripts", newFilePath)

edit(newFilePath, kenvPath())

export {}
