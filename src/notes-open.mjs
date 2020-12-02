#!js

let dir = process.env.NOTES_PATH
let filename = $1
let file = `${dir}${filename}`

execSync(`open -a 'Visual Studio Code' ${dir} -g ${file}`)
