import { backToMainShortcut, cmd } from "../core/utils.js"
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
  let { fileIconToFile } = await npm("file-icon")
  setLoading(true)
  let { apps, prefs } = await findAppsAndPrefs()
  let group = (regex: RegExp) => (apps: string[]) =>
    apps
      .filter(app => app.match(regex))
      .sort((a, b) => {
        let aName = a.replace(/.*\//, "")
        let bName = b.replace(/.*\//, "")
        return aName > bName ? 1 : aName < bName ? -1 : 0
      })
  let assetsPath = kitPath(
    "assets",
    "app-launcher",
    "icons"
  )
  await ensureDir(assetsPath)
  return await Promise.all(
    [
      ...group(/^\/Applications\/(?!Utilities)/)(apps),
      ...group(/^\/System\/Applications/)(apps),
      ...group(/\.prefPane$/)(prefs),
      ...group(/^\/Applications\/Utilities/)(apps),
      ...group(
        /^\/System\/Library\/CoreServices\/Applications/
      )(apps),
      ...group(/^\/System\/Library\/CoreServices/)(apps),
      // ...group(/System/)(apps),
      ...group(/Users/)(apps),
    ].map(async appPath => {
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
