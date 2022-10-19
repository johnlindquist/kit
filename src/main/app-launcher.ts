import { backToMainShortcut, cmd } from "../core/utils.js"
// Description: App Launcher
setName(``)
let findAppsAndPrefs = async () => {
  let apps = await fileSearch("", {
    onlyin: "/",
    kind: "application",
  })
  let manualAppDir = await readdir("/Applications")
  apps = apps.concat(
    manualAppDir
      .filter(app => app.endsWith(".app"))
      .map(app => `/Applications/${app}`)
  )
  apps = _.uniq(apps.filter(a => !a.includes("Users")))

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
  let { fileIconToFile } = await npm("file-icon")
  setLoading(true)
  let { apps, prefs } = await findAppsAndPrefs()
  let assetsPath = kitPath(
    "assets",
    "app-launcher",
    "icons"
  )
  await ensureDir(assetsPath)
  let choices = await Promise.all(
    apps.concat(prefs).map(async appPath => {
      let { base: appName } = path.parse(appPath)
      let destination = path.resolve(
        assetsPath,
        `${appName}.png`
      )
      setFooter(`Creating icon for ${appName}`)
      try {
        await fileIconToFile(appPath, {
          destination,
          size: 48,
        })
      } catch (error) {
        log(`Failed to get icon for ${appName}`)
      }
      return {
        name: appName.replace(".app", ""),
        value: appPath,
        description: appPath,
        img: destination,
        enter: `Open`,
      }
    })
  )

  choices = _.sortBy(choices, "name")

  return choices
}
let appsDb = await db("apps", async () => {
  setChoices([])
  clearTabs()
  setPlaceholder(`One sec...`)
  setPanel(
    md(`# First Run: Indexing Apps and Caching Icons...
  
  Please hold a few seconds while Script Kit creates icons for your apps and preferences for future use.
    `)
  )
  let choices = await createChoices()
  setFooter(``)
  return {
    choices,
  }
})
let app = await arg(
  {
    input: (flag?.input as string) || "",
    placeholder: "Select an app to launch",
    resize: true,
    shortcuts: [
      backToMainShortcut,
      {
        name: "Refresh Apps",
        key: `${cmd}+enter`,
        bar: "right",
        onPress: async input => {
          setPlaceholder(`Refreshing apps...`)
          await remove(kitPath("db", "apps.json"))
          await run(
            kitPath("main", "app-launcher.js"),
            "--input",
            input
          )
        },
      },
    ],
  },
  appsDb.choices
)
if (app) {
  open(app)
}
