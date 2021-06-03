// Description: Run the selected script
let { buildMainPromptChoices, toggleBackground } =
  await import("../utils.js")

let script = await arg<Script>(
  `Which script do you want to run?`,
  await buildMainPromptChoices()
)

console.log({ script })

let shouldEdit =
  script.watch || script.schedule || script.system

if (script.background) {
  toggleBackground(script)
} else if (shouldEdit) {
  await edit(script.filePath, kenvPath())
} else {
  await run(script.command)
}

export {}
