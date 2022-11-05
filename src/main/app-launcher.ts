import { backToMainShortcut, cmd } from "../core/utils.js"
// Description: App Launcher

setName(``)
let findAppsAndPrefs = async () => {
  log(`findAppsAndPrefs`)
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
  // apps = _.uniq(apps.filter(a => !a.includes("Users")))
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
  let allApps = apps.concat(prefs)

  let destination = allApps.map(appPath => {
    let { base: appName } = path.parse(appPath)
    return path.resolve(assetsPath, `${appName}.png`)
  })

  log(`Creating icons for ${allApps.length} apps`)
  await fileIconToFile(allApps, {
    size: 48,
    destination,
  })

  log(`Done creating icons`)

  let choices = _.sortBy(
    allApps.map(appPath => {
      let { base: appName } = path.parse(appPath)
      let destination = path.resolve(
        assetsPath,
        `${appName}.png`
      )

      return {
        name: appName.replace(".app", ""),
        value: appPath,
        description: appPath,
        img: destination,
        enter: `Open`,
      }
    }),
    ["value", "name"]
  )

  return choices
}
let appsDb = await db(
  kitPath("db", "apps.json"),
  async () => {
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
  }
)
let app = await arg(
  {
    input: (flag?.input as string) || "",
    placeholder: "Select an app to launch",
    resize: false,
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
  appsDb.choices as any
)
if (app) {
  open(app)
}
