mkdir(simplePath())

let dirs = ["cache", "db", "bin", "lib", "logs", "tmp"]

dirs.forEach(dir => {
  mkdir(simplePath(dir))
})

let copies = ["app", "scripts", "templates", "package.json"]

copies.forEach(async source => {
  cp(
    "-r",
    sdkPath(`setup/copy/${source}`),
    simplePath(source)
  )
})

ln("-s", sdkPath(), simplePath("sdk"))
