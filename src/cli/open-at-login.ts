// Description: Toggle Open at Login

import { Channel } from "../core/enum.js"

import { getAppDb } from "../core/db.js"

let { openAtLogin } = await getAppDb()

let placeholder = `"Open at login" is ${
  openAtLogin ? "en" : "dis"
}abled`

let toggle = await arg(placeholder, [
  {
    name: "Enable",
    value: true,
  },
  {
    name: "Disable",
    value: false,
  },
])

send(Channel.SET_LOGIN, toggle)

export {}
