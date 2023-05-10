import fs from "fs/promises"

let examplesDir = kenvPath("kenvs", "examples")
if (await isDir(examplesDir)) {
  cd(examplesDir)

  if (isDir(kenvPath("kenvs", "examples", ".git"))) {
    await exec(`git stash`)
    await exec(`git pull`)
  }
} else {
  cd(kenvPath("kenvs"))
  if (await isBin("git")) {
    await exec(
      `git clone https://github.com/johnlindquist/kit-examples examples`
    )
  } else {
    let destination = kenvPath("tmp")
    await download(
      `https://github.com/johnlindquist/kit-examples/archive/main.zip`,
      destination,
      {
        extract: true,
        rejectUnauthorized: false,
      }
    )

    // move diretory destination to kenvPath("kenvs", "kit-examples")
    let source = path.join(destination, "kit-examples-main")
    let newDestination = kenvPath("kenvs", "examples")
    await fs.rename(source, newDestination)

    // find the first file in the new destination and touch it
    let files = await fs.readdir(
      path.join(newDestination, "scripts")
    )
    let firstFile = path.join(
      newDestination,
      "scripts",
      files[0]
    )
    // if firstFile exists, touch it
    if (await fs.stat(firstFile)) {
      await wait(1000)
      await fs.utimes(firstFile, new Date(), new Date())
    }
  }
}

export {}
