// Description: Templates

import { cmd } from "../core/utils.js"
import { Script } from "../types/core.js"
setName(``)

setFlags({
  ["new"]: {
    name: "New",
    description: "Create a new template script",
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

let templateScript = await selectScript(
  {
    placeholder: "Select a template",
    footer: `create template: ${cmd}+n | edit template: ${cmd}+o | remove template: ${cmd}+shift+delete`,
  },
  true,
  scripts => scripts.filter(script => script?.template)
)

if (flag?.new) {
  let script = await arg("Enter a Template Script Name")
  //   let script = templateScriptName
  //     .replace(/[^\w\s-]/g, "")
  //     .trim()
  //     .replace(/\s/g, "-")
  //     .toLowerCase()

  await run(
    `${kitPath(
      "cli",
      "new"
    )}.js --template template ${script
      .trim()
      .replace(/\s/g, "-")
      .toLowerCase()} --scriptName '${script.trim()}'`
  )
} else if (flag?.edit) {
  await edit(
    (templateScript as Script).filePath,
    kenvPath()
  )
} else if (flag?.remove) {
  await run(
    `${kitPath("cli", "remove")}.js ${
      (templateScript as Script).filePath
    } `
  )
} else {
  await run((templateScript as Script).filePath)
}

export {}
