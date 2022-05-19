let appsPath = kitPath("db", "apps.json")
if (await isFile(appsPath)) await remove(appsPath)

let findAppsAndPrefs = async () => {
  let apps = await fileSearch("", {
    onlyin: "/",
    kind: "application",
  })
  let prefs = await fileSearch("", {
    onlyin: "/",
    kind: "preferences",
  })
  return {
    apps,
    prefs,
  }
}

let createChoices = async () => {
  let { apps, prefs } = await findAppsAndPrefs()
  let group = path => apps =>
    apps
      .filter(app => app.match(path))
      .sort((a, b) => {
        let aName = a.replace(/.*\//, "")
        let bName = b.replace(/.*\//, "")
        return aName > bName ? 1 : aName < bName ? -1 : 0
      })
  return await Promise.all(
    [
      ...group(/^\/Applications\/(?!Utilities)/)(apps),
      ...group(/^\/System\/Applications/)(apps),
      ...group(/\.prefPane$/)(prefs),
      ...group(/^\/Applications\/Utilities/)(apps),
      ...group(
        /^\/System\/Library\/CoreServices\/Applications/
      )(apps),
      // ...group(/System/)(apps),
      ...group(/Users/)(apps),
    ].map(async appPath => {
      let appName = appPath.split("/").pop()
      let appResourceDir = path.resolve(
        appPath,
        "Contents",
        "Resources"
      )
      let img = ``
      if (await isDir(appResourceDir)) {
        let appFiles = await readdir(appResourceDir)
        let icon = appFiles.find(name =>
          name.endsWith(`.icns`)
        )
        if (icon) {
          let iconPath = path.resolve(appResourceDir, icon)
          let assetsPath = kitPath(
            "assets",
            "app-launcher",
            "icons"
          )
          await ensureDir(assetsPath)
          let iconName = `${appName}.png`
          img = path.resolve(assetsPath, iconName)
          await exec(
            `sips -z 320 320 -s format png '${iconPath}' --out '${img}'`
          )
        }
      }
      return {
        name: appName.replace(".app", ""),
        value: appPath,
        description: appPath,
        img,
      }
    })
  )
}

await db("apps", async () => {
  return {
    choices: await createChoices(),
  }
})

export {}
