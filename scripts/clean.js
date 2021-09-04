import rimraf from "rimraf"
let scriptDirs = [
  "api",
  "ci",
  "cli",
  "ipc",
  "lib",
  "main",
  "setup",
]

scriptDirs.forEach(dir => {
  rimraf(dir, [], () => {
    console.log(`${dir} removed`)
  })
})
