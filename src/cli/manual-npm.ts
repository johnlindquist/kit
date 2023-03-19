let command = ``
if (!isWin) {
  command = `export PATH=${knodePath("bin")}:$PATH `
}

await term({
  command,
  cwd: kenvPath(),
})

export {}
