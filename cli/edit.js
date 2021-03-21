// Description: Opens the selected script in your editor

let { menu, scripts, validate } = await cli("fns")

let file = await arg(
  {
    message: `Which script do you want to edit?`,
    validate,
  },
  menu
)

file = file.endsWith(".js") ? file : `${file}.js`
edit(kenvPath(`scripts/${file}`), kenvPath())
