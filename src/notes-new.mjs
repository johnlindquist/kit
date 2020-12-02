#!js
let dir = process.env.NOTES_PATH
let filename = $1.replace(/ /g, "-") + ".md"

let template = `
# ${titleCase($1)}

${new Date().toDateString()}

`.trim()
let file = `${dir}${filename}`

if (!shell.test("-e", file)) {
  await writeFile(file, template)
}

execSync(`open -a 'Visual Studio Code' ${dir} -g ${file}`)
