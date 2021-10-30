import { Bin } from "../core/enum.js"
import { selectScript } from "../core/utils.js"
import { createBinFromScript } from "./lib/utils.js"

let type = await arg<Bin>(
  "Select type:",
  Object.values(Bin)
)

let script = await selectScript(
  `Create bin from which script?`,
  false
)
await createBinFromScript(type, script)
export {}
