import {
  getLastSlashSeparated,
  getKenvs,
} from "kit-bridge/esm/util"

let dir = await arg(
  "Remove which kenv",
  (
    await getKenvs()
  ).map(value => ({
    name: getLastSlashSeparated(value, 1),
    value,
  }))
)
await trash(dir)

export {}
