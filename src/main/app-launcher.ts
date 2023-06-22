import {
  backToMainShortcut,
  cmd,
  sortBy,
  uniq,
} from "../core/utils.js"
// Name: App Launcher
// Description: Select an App to Launch
// Cache: true

preload()

let findAppsAndPrefs = async () => {
  log(`findAppsAndPrefs`)
  if (process.platform === "darwin") {
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
    // apps = uniq(apps.filter(a => !a.includes("Users")))
    let prefs = await fileSearch("", {
      onlyin: "/",
      kind: "preferences",
    })
    return {
      apps,
      prefs,
    }
  } else if (process.platform === "win32") {
    let globalApps = await fileSearch("", {
      onlyin:
        '"%ProgramData%\\Microsoft\\Windows\\Start Menu\\Programs"',
      kind: "application",
    })
    let apps = await fileSearch("", {
      onlyin:
        '"%AppData%\\Microsoft\\Windows\\Start Menu\\Programs"',
      kind: "application",
    })
    return {
      apps: [...globalApps, ...apps],
      prefs: [],
    }
  }
}
let createChoices = async () => {
  let extractIcon =
    process.platform === "win32"
      ? (await npm("get-app-icon")).extractIcon
      : () => Promise.resolve(undefined)
  setLoading(true)
  let { apps, prefs } = await findAppsAndPrefs()
  let allApps = uniq(apps.concat(prefs))

  let assetsPath = kitPath(
    "assets",
    "app-launcher",
    "icons"
  )
  if (process.platform === "darwin") {
    let { fileIconToFile } = await npm("file-icon")
    await ensureDir(assetsPath)
    let allApps = uniq(apps.concat(prefs))

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
  }

  let choices = sortBy(
    await Promise.all(
      allApps.map(async appPath => {
        let { base: appName } = path.parse(appPath)
        let destination = path.resolve(
          assetsPath,
          `${appName}.png`
        )

        let value = appPath.replace(/\r?\n?$/i, "")
        return {
          id: value,
          name: appName.replace(/\.(app|lnk|url)\s*$/i, ""),
          value,
          description: appPath.replace(/\r?\n?$/i, ""),
          img:
            process.platform === "darwin"
              ? destination
              : await extractIcon(appPath.trim()).catch(
                  () => undefined
                ),
          enter: `Open`,
        }
      })
    ),
    ["value", "name"]
  )

  return choices
}
let appsDb = await db(
  kitPath("db", "apps.json"),
  async () => {
    setResize(true)
    setChoices([
      {
        name: `First Run: Indexing Apps and Caching Icons...`,
        description: `Please hold a few seconds while Script Kit creates icons for your apps and preferences for future use.`,
        info: "always",
      },
    ])

    clearTabs()
    setPlaceholder(`One sec...`)

    let choices = await createChoices()
    return {
      choices,
    }
  }
)

if (!flag?.prep) {
  let app = await arg(
    {
      key: "app-launcher",
      input: (flag?.input as string) || "",
      resize: true,
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
    appsDb.choices as any
  )
  if (app) {
    open(app)
  }
}
