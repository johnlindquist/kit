// Description: App Launcher
setName(``)
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

let appsDb = await db("apps", async () => {
  setChoices([])
  setPrompt({
    tabs: [],
  })
  console.log(
    `First run: Indexing apps and converting icons...`
  )
  let choices = await createChoices()
  console.clear()
  return {
    choices,
  }
})

let input = ""
let app = await arg(
  {
    input: (flag?.input as string) || "",
    placeholder: "Select an app to launch",
    footer: "cmd+enter to refresh",
    onInput: i => {
      input = i
    },
  },
  appsDb.choices
)
if (flag?.cmd) {
  await remove(kitPath("db", "apps.json"))
  await run(
    kitPath("main", "app-launcher.js"),
    "--input",
    input
  )
} else {
  let command = `open -a "${app}"`
  if (app.endsWith(".prefPane")) {
    command = `open ${app}`
  }
  await exec(command)
  hide()
}

export {}
