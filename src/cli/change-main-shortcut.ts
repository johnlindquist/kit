let { shortcut } = await hotkey("Type a key combo")

let confirm = await arg(`Accept: "${shortcut}"`, [
  {
    name: `Yes`,
    value: true,
  },
  {
    name: `Retry`,
    value: false,
  },
])

if (confirm) {
  let kitDb = await db(kitAppPath("db", "shortcuts.json"))
  kitDb.data.shortcuts[kitPath("main", "index.js")] =
    shortcut
  await kitDb.write()
} else {
  await cli("change-main-shortcut")
}

export {}
