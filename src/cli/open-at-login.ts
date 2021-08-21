// Description: Toggle Open at Login

import { Channel } from "kit-bridge/esm/enum"
import { getAppDb } from "kit-bridge/esm/db"

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

send(Channel.SET_LOGIN, { openAtLogin: toggle })

export {}
