#!js

let template = `#!js

`

let symName = $1
let fileName = `${$1}.mjs`
let symFilePath = path.join(JS_PATH, "bin", symName)
let filePath = path.join(JS_PATH, "src", fileName)

await writeFile(filePath, template)
chmod(755, filePath)

ln("-s", filePath, symFilePath)

code(filePath, JS_PATH, 3)
