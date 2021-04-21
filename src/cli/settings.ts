let kitDB = db("kit")

let selectedSetting = await arg("Which setting")
let value = await arg("Set to what?")

kitDB.set(selectedSetting, value).write()

export {}
