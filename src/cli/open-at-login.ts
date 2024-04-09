// Description: Toggle Open at Login

import { getEnvVar, setEnvVar } from "../api/kit.js"

let openAtLogin = await getEnvVar(
  "KIT_OPEN_AT_LOGIN",
  "true"
)

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

await setEnvVar(
  "KIT_OPEN_AT_LOGIN",
  toggle ? "true" : "false"
)

export {}
