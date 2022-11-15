let examplesDir = kenvPath("kenvs", "examples")
if (await isDir(examplesDir)) {
  cd(examplesDir)

  await exec(`git stash`)
  await exec(`git pull`)
} else {
  cd(kenvPath("kenvs"))
  await exec(
    `git clone https://github.com/johnlindquist/kit-examples examples`
  )
}

export {}
