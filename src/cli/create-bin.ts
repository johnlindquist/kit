import { Bin } from "../enums.js"
import {
  createBinFromScript,
  selectScript,
} from "../utils.js"

let type = await arg<Bin>(
  "Select type:",
  Object.values(Bin)
)

await createBinFromScript(type, await selectScript())
export {}
