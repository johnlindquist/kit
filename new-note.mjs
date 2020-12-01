#!js
import dotenv from "dotenv"
dotenv.config()

let dir = process.env.NOTES_PATH
let filename = $1.replace(/ /g, "-") + ".md"

let template = `
# ${titleCase($1)}

${new Date().toDateString()}

`.trim()
let file = `${dir}${filename}`

try {
  await access(file)
} catch {
  await writeFile(file, template)
}

await exec(`open -a 'Visual Studio Code' ${dir} -g ${file}`)
