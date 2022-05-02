// Description: Snippets

import { cmd } from "../core/utils.js"
import { Script } from "../types/core.js"
setName(``)

setFlags({
  ["new"]: {
    name: "New",
    description: "Create a new snippet script",
    shortcut: `${cmd}+n`,
  },
  ["edit"]: {
    name: "Edit",
    description: "Open the selected script in your editor",
    shortcut: `${cmd}+o`,
  },
  remove: {
    name: "Remove",
    description: "Delete the selected script",
    shortcut: `${cmd}+shift+backspace`,
  },
})

let snippetScript = await selectScript(
  {
    placeholder: "Select a snippet",
    footer: `create snippet: ${cmd}+n | edit snippet: ${cmd}+o | remove snippet: ${cmd}+shift+delete`,
  },
  true,
  scripts => scripts.filter(script => script?.snippet)
)

if (flag?.new) {
  let script = await arg("Enter a Snippet Script Name")

  await run(
    `${kitPath("cli", "new")}.js --template snippet ${script
      .trim()
      .replace(/\s/g, "-")
      .toLowerCase()} --scriptName '${script.trim()}'`
  )
} else if (flag?.edit) {
  await edit((snippetScript as Script).filePath, kenvPath())
} else if (flag?.remove) {
  await run(
    `${kitPath("cli", "remove")}.js ${
      (snippetScript as Script).filePath
    } `
  )
} else {
  await run((snippetScript as Script).filePath)
}

export {}
