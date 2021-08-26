await trash(kitPath("src", "*"))
let tmpScriptsPath = kitPath("tmp", "scripts")
if (!(await isDir(tmpScriptsPath))) {
  mkdir("-p", tmpScriptsPath)
}

cp("-r", kenvPath("scripts"), tmpScriptsPath)

export {}
