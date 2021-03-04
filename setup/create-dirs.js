mkdir(kenvPath())

let dirs = ["cache", "db", "bin", "lib", "logs", "tmp"]

dirs.forEach(dir => {
  mkdir(kenvPath(dir))
})

let copies = ["app", "scripts", "templates", "package.json"]

copies.forEach(async source => {
  cp(
    "-r",
    kitPath(`setup/copy/${source}`),
    kenvPath(source)
  )
})

cp(kitPath(`setup/copy/gitignore`), kenvPath(".gitignore"))

ln("-s", kitPath(), kenvPath("kit"))
