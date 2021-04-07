let rimraf = require("rimraf")
let scriptDirs = [
  "ci",
  "cli",
  "ipc",
  "lib",
  "main",
  "preload",
  "setup",
]

scriptDirs.forEach(dir => {
  rimraf(dir, [], () => {
    console.log(`${dir} removed`)
  })
})
