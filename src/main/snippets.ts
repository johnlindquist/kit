// Name: View Snippets
// Description: Browse and edit snippets

import {
  backToMainShortcut,
  closeShortcut,
  cmd,
} from "../core/utils.js"
import { Script } from "../types/core.js"
setName(``)

let snippetScript = await selectScript(
  {
    placeholder: "Select a snippet",
    enter: "Run",
    shortcuts: [
      {
        name: "New Snippet",
        key: `${cmd}+n`,
        bar: "left",

        onPress: async () => {
          let script = await arg({
            placeholder: "Enter a Snippet Script Name",
            enter: "Submit",
            shortcuts: [backToMainShortcut, closeShortcut],
          })
          await run(
            `${kitPath(
              "cli",
              "new"
            )}.js --template snippet ${script
              .trim()
              .replace(/\s/g, "-")
              .toLowerCase()} --scriptName '${script.trim()}'`
          )
        },
      },
      {
        name: "Edit",
        key: `${cmd}+o`,
        bar: "right",
        onPress: async (input, { focused }) => {
          await run(
            kitPath("cli", "edit-script.js"),
            focused?.value?.filePath
          )
        },
      },
      {
        name: "Remove",
        key: `${cmd}+shift+backspace`,
        bar: "right",
        onPress: async (input, { focused }) => {
          await run(
            kitPath("cli", "remove.js"),
            focused?.value?.filePath
          )
        },
      },
    ],
  },
  true,
  scripts => scripts.filter(script => script?.snippet)
)

await run((snippetScript as Script).filePath)

export {}
