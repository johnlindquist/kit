/**
 * Description: Pastes the contents of your clipboard into a file named by the timestamp
 */
import { format } from "date-fns"

const date = format(new Date(), "yyyy-MM-dd-hh-mm-ss")
const fileName = date + ".md"

const template = `
Your pasted contents are here:
${paste()}
`.trim()

let directory = await arg(
  "Where do you want to save the file?",
  {
    type: "dir",
  }
)

let confirm = await prompt({
  name: "value",
  type: "confirm",
  message: `Hitting enter will create a file named "${chalk.yellow(
    fileName
  )}"
  containing your clipboard contents in "${chalk.yellow(
    directory
  )}".

  Continue?`,
})

let filePath = path.join(directory, fileName)
if (confirm.value) {
  await writeFile(filePath, template)
  launchEditor(filePath)
} else {
  echo("Ok, cancelled.")
}
