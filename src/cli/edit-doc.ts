import { setScriptTimestamp } from "../core/db.js"
import {
  backToMainShortcut,
  closeShortcut,
  cmd,
  setMetadata,
} from "../core/utils.js"
let scriptPath = await arg()
// TODO: centralize .ts/.js finding logic
let { name, dir } = path.parse(scriptPath)

if (scriptPath.endsWith(".mjs")) {
  scriptPath = path.resolve(
    dir,
    "..",
    "scripts",
    name + ".ts"
  )
}

let docPath = path.resolve(
  path.dirname(path.dirname(scriptPath)),
  "docs",
  name + ".md"
)

await ensureFile(docPath)

if (
  process.env.KIT_EDITOR === "kit" &&
  process.env.KIT_CONTEXT === "app"
) {
  setScriptTimestamp(scriptPath)
  let value = await readFile(docPath, "utf-8")
  await editor({
    value,
    description: docPath,
    language: "md",
    shortcuts: [
      {
        ...backToMainShortcut,
        onPress: async input => {
          await writeFile(docPath, input)
          await mainScript()
        },
      },

      closeShortcut,
      {
        name: `Save`,
        key: `${cmd}+s`,
        onPress: async input => {
          await writeFile(docPath, input)
          await mainScript()
        },
        bar: "right",
      },
    ],
  })
} else {
  await edit(docPath, kenvPath())
}
