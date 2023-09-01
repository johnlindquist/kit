// Exclude: true
// Description: Open with...

import { sortBy, uniq } from "../core/utils.js"
import { Open } from "../types/packages"

let filePath = await path()
setName(``)
let findApps = async () => {
  let apps = await fileSearch("", {
    onlyin: "/",
    kMDItemContentType: "com.apple.application-bundle",
  })
  let manualAppDir = await readdir("/Applications")
  apps = apps.concat(
    manualAppDir
      .filter(app => app.endsWith(".app"))
      .map(app => `/Applications/${app}`)
  )
  apps = uniq(apps.filter(a => !a.includes("Users")))

  return {
    apps,
  }
}
let createChoices = async () => {
  let { fileIconToFile } = await npm("file-icon")
  setLoading(true)
  let { apps } = await findApps()
  let assetsPath = kitPath(
    "assets",
    "app-launcher",
    "icons"
  )
  await ensureDir(assetsPath)
  let destination = apps.map(appPath => {
    let { base: appName } = path.parse(appPath)
    return path.resolve(assetsPath, `${appName}.png`)
  })

  log(`Creating icons for ${apps.length} apps`)

  await fileIconToFile(apps, {
    size: 48,
    destination,
  })

  log(`Done creating icons`)

  let choices = sortBy(
    apps.map(appPath => {
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

  await Promise.all([
    (open as unknown as Open)(filePath, {
      app: {
        name: app,
      },
    }),
    await hide(),
  ])
}
export {}
