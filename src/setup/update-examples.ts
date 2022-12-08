let examplesDir = kenvPath("kenvs", "examples")
if (await isDir(examplesDir)) {
  cd(examplesDir)

  await exec(`git stash`)
  await exec(`git pull`)
}

export {}
