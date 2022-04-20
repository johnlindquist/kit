import { cmd } from "../core/utils.js"

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
  return [
    ...group(/^\/Applications\/(?!Utilities)/)(apps),
    ...group(/^\/System\/Applications/)(apps),
    ...group(/\.prefPane$/)(prefs),
    ...group(/^\/Applications\/Utilities/)(apps),
    // ...group(/System/)(apps),
    ...group(/Users/)(apps),
  ].map(value => {
    return {
      name: value.split("/").pop().replace(".app", ""),
      value,
      description: value,
    }
  })
}
let appsDb = await db("apps", async () => ({
  choices: await createChoices(),
}))

let REFRESH = `__REFRESH__`

let input = ""
let app = await arg(
  {
    input: (flag?.input as string) || "",
    placeholder: "Select an app to launch",
    footer: "cmd+enter to refresh",
    onShortcutSubmit: {
      [`${cmd}+enter`]: REFRESH,
    },
    onInput: i => {
      input = i
    },
  },
  appsDb.choices
)
if (app === REFRESH) {
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
