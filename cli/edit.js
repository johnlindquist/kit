// Description: Opens the selected script in your editor

let { scripts, validate } = await cli("fns")

let file = await arg(
  {
    message: `Which script do you want to edit?`,
    validate,
  },
  scripts
)

file = file.endsWith(".js") ? file : `${file}.js`
edit(kenvPath(`scripts/${file}`), kenvPath())
