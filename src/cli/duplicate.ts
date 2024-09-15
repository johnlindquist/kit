// Description: Duplicate the selected script

import {
  checkIfCommandExists,
  stripName,
  kitMode,
  stripMetadata,
  uniq,
} from "../core/utils.js"
import { generate } from "@johnlindquist/kit-internal/project-name-generator"

let examples = Array.from({ length: 3 })
  .map((_, i) => generate({ words: 2 }).dashed)
  .join(", ")

let { filePath } = await selectScript(
  "Select Script to Duplicate"
)

// TODO: Consider Using the "info" approach

let name = await arg(
  {
    description: `Duplicate ${filePath}`,
    debounceInput: 0,
    placeholder: `Enter name for new script`,
    validate: input => {
      return checkIfCommandExists(stripName(input))
    },
    strict: false,
  },
  input => [
    {
      info: true,
      name: !input
        ? `Enter a name for your script's // Name: metadata`
        : `// Name: ${input}`,
      description: !input
        ? `The filename will be converted automatically.`
        : `Filename will be converted to ${stripName(
            input
          )}.${kitMode()}`,
    },
  ]
)

if (!(await isFile(filePath))) {
  console.warn(`${filePath} doesn't exist...`)
  exit()
}

let { dirPath: selectedKenvPath } = await selectKenv({
  placeholder: `Select Where to Create Script`,
  enter: "Create Script in Selected Kenv",
})

let command = stripName(name)

let scriptPath = path.join(
  selectedKenvPath,
  "scripts",
  `${command}.${kitMode()}`
)
let oldContent = await readFile(filePath, "utf-8")

let newContent = stripMetadata(oldContent, [
  "Author",
  "Twitter",
  "Alias",
  "Description",
])

// Replace // Name: with // Name: ${name}
newContent = newContent.replace(
  /(\/\/\s+Name:).*/,
  `$1 ${name}`
)

await writeFile(scriptPath, newContent)

await cli("create-bin", "scripts", scriptPath)

await run(kitPath("cli", "edit-script.js"), scriptPath)

export {}
