#!js
const JS_PATH = process.env.JS_PATH

args.forEach(arg => {
  let symPath = path.join(JS_PATH, "src", `${arg}.mjs`)
  let filePath = path.join(JS_PATH, "bin", arg)

  let symResult = shell.rm(symPath)

  if (!symResult.stderr) {
    shell.echo(`Removed ${symPath}`)
  }

  let fileResult = shell.rm(filePath)

  if (!fileResult.stderr) {
    shell.echo(`Removed ${filePath}`)
  }
})
