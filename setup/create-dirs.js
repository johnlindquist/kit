mkdir(projectPath())

let dirs = ["cache", "db", "bin", "lib", "logs", "tmp"]

dirs.forEach(dir => {
  mkdir(projectPath(dir))
})

let copies = ["app", "scripts", "templates", "package.json"]

copies.forEach(async source => {
  cp(
    "-r",
    kitPath(`setup/copy/${source}`),
    projectPath(source)
  )
})

ln("-s", kitPath(), projectPath("kit"))
