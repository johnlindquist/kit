// Description: Run the selected script
let { findScript } = await cli("fns")

let menu: any[]
let menuCachePath = kenvPath("cache", "menu-cache.json")
if (await isFile(menuCachePath)) {
  menu = JSON.parse(await readFile(menuCachePath, "utf-8"))
} else {
  menu = await (await cli("menu")).menu
}

let script = await arg(
  {
    placeholder: `Which script do you want to run?`,
    validate: findScript,
  },
  menu
)

await run(script)

export {}
