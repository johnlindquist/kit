try {
  await cli("install", kitPath())

  await copyFile(
    kitPath("templates", "config", "tsconfig.json"),
    kenvPath("tsconfig.json")
  )

  await copyFile(
    kitPath("templates", "scripts", "default.js"),
    kenvPath("templates", "default.js")
  )

  await copyFile(
    kitPath("templates", "scripts", "default.ts"),
    kenvPath("templates", "default.ts")
  )

  let kenvPkgPath = kenvPath("package.json")
  let kenvPkg = await readJson(kenvPkgPath)

  if (kenvPkg.dependencies?.kit) {
    await cli("uninstall", "kit")
  }

  let kenvIgnore = kenvPath(".gitignore")
  if (await pathExists(kenvIgnore)) {
    let contents = await readFile(kenvIgnore, "utf-8")
    if (!contents.match(/^\.scripts$/gm)) {
      await appendFile(
        kenvIgnore,
        `
.scripts`
      )
    }
  }
} catch (error) {
  console.log(error)
}

export {}
