// Description: Generate an alliteraive, dashed project name, copies it to the clipboard, and shows a notification

let { default: generate } = await autoInstall(
  "project-name-generator"
)

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

let { notify } = await import("./system/notify.js")
notify(name, "copied to clipboard")
