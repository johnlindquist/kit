let examplesDir = kenvPath("kenvs", "examples")
if (await isDir(examplesDir)) {
  cd(examplesDir)
  await exec(`git pull --rebase --autostash --stat`)
} else {
  cd(kenvPath("kenvs"))
  await exec(
    `git clone https://github.com/johnlindquist/kit-examples examples`
  )
}

export {}
