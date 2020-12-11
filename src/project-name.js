/**
 * Description: Generate an alliteraive, dashed project name, copies it to the clipboard, and shows a notification
 *
 * Usage:
 * project-name
 */
import generate from "project-name-generator"

const name = generate({ word: 2, alliterative: true })
  .dashed

echo(
  `Note #1: "${name}" has been copied to the clipboard. Paste anywhere to see it.`
)
copy(name)
echo(`Note #2: "${name}" was posted as a notifiction.`)
notify(name, "copied to clipboard")
