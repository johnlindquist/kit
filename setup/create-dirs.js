await mkdir(simplePath())

let dirs = ["cache", "db", "bin", "logs", "tmp"]

dirs.forEach(async dir => {
  await mkdir(simplePath(dir))
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
