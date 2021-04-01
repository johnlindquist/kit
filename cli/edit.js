// Description: Opens the selected script in your editor

let { menu, findScript } = await cli("fns")

let file = await arg(
  {
    message: `Which script do you want to edit?`,
    validate: findScript,
  },
  menu
)

file = file.endsWith(".js") ? file : `${file}.js`
edit(kenvPath(`scripts/${file}`), kenvPath())
