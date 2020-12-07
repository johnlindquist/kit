#!js
/**
 * Creates a new script with symlinks and permissions then opens it in VS Code
 *
 * Usage:
 * new my-first-script
 */

let result = exec(`type ${$1}`, { silent: true })
if (result.stdout) {
  console.log(`${$1} already exists. 
${result.stdout.trim()}
Aborting...`)
  exit()
}

let template = `#!js

`

if (args.paste) {
  template = paste()
}

let symName = $1
let fileName = `${$1}.mjs`
let symFilePath = path.join(JS_PATH, "bin", symName)
let filePath = path.join(JS_PATH, "src", fileName)

await writeFile(filePath, template)
chmod(755, filePath)

ln("-s", filePath, symFilePath)

code(filePath, JS_PATH, 3)
