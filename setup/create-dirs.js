await mkdir(simplePath())

let dirs = [
  "cache",
  "db",
  "bin",
  "logs",
  "scripts",
  "templates",
  "tmp",
]

dirs.forEach(async dir => {
  await mkdir(simplePath(dir))
})

cp("-r", sdkPath("setup/app"), simplePath("app"))
cp(
  sdkPath("setup/package.json"),
  simplePath("package.json")
)

ln("-s", sdkPath(), simplePath("sdk"))
