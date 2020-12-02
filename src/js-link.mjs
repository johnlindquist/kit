#!js

const JS_PATH = process.env.JS_PATH

args.forEach(arg => {
  let symName = arg
  let fileName = `${arg}.mjs`
  let symFilePath = path.join(JS_PATH, "bin", symName)
  let filePath = path.join(JS_PATH, "src", fileName)

  shell.ln("-s", filePath, symFilePath)
})
