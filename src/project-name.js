// Description: Generate an alliteraive, dashed project name, copies it to the clipboard, and shows a notification

import generate from "project-name-generator"

const name = generate({ word: 2, alliterative: true })
  .dashed

echo(
  `> "${chalk.yellow(
    name
  )}" has been copied to the clipboard. Paste anywhere to see it.`
)
copy(name)
echo(
  `> "${chalk.yellow(name)}" was posted as a notifiction.`
)
notify(name, "copied to clipboard")
