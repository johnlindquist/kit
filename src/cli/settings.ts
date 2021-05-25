let kitDB = await db("kit")

let selectedSetting = await arg("Which setting")
let value = await arg("Set to what?")

kitDB.data[selectedSetting] = value
await kitDB.write()

export {}
