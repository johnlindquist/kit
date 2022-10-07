// Description: Open with...
let filePath = await path()
setName(``)
let findApps = async () => {
  let apps = await fileSearch("", {
    onlyin: "/",
    kind: "application",
  })
  return {
    apps,
  }
}
let createChoices = async () => {
  let { fileIconToFile } = await npm("file-icon")
  let { apps } = await findApps()
  let assetsPath = kitPath(
    "assets",
    "app-launcher",
    "icons"
  )
  await ensureDir(assetsPath)
  let group = (regex: RegExp) => (apps: string[]) =>
    apps
      .filter(app => app.match(regex))
      .sort((a, b) => {
        let aName = a.replace(/.*\//, "")
        let bName = b.replace(/.*\//, "")
        return aName > bName ? 1 : aName < bName ? -1 : 0
      })
  return await Promise.all(
    [
      ...group(/^\/Applications\/(?!Utilities)/)(apps),
      ...group(/^\/System\/Applications/)(apps),
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
let input = ""
let app = await arg(
  {
    input: (flag?.input as string) || "",
    placeholder: "Open with...",
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
  let command = `open -a "${app}" "${filePath}"`
  await exec(command)
  hide()
}
export {}
