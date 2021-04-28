// Description: Opens the selected script in your editor

let { menu } = await cli("fns")

let file = await arg(
  {
    placeholder: `Which script do you want to edit?`,
  },
  menu
)

file = file.endsWith(".js") ? file : `${file}.js`
edit(kenvPath(`scripts/${file}`), kenvPath())

export {}
