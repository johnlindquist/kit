#!js

const JS_PATH = process.env.JS_PATH

let template = `#!js

`

let symName = $1
let fileName = `${$1}.mjs`
let symFilePath = path.join(JS_PATH, "bin", symName)
let filePath = path.join(JS_PATH, "src", fileName)

await writeFile(filePath, template)
shell.chmod(755, filePath)

shell.ln("-s", filePath, symFilePath)

code(filePath, JS_PATH, 3)
