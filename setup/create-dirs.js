await mkdir(simplePath())

let dirs = ["cache", "db", "bin", "logs", "scripts", "tmp"]

dirs.forEach(async dir => {
  await mkdir(simplePath(dir))
})

cp("-r", sdkPath("setup/copy/app"), simplePath("app"))
cp(
  "-r",
  sdkPath("setup/copy/templates"),
  simplePath("templates")
)
cp(
  sdkPath("setup/copy/package.json"),
  simplePath("package.json")
)

ln("-s", sdkPath(), simplePath("sdk"))
