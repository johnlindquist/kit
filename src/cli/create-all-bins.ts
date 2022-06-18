import { Bin } from "../core/enum.js"
import { getScripts } from "../core/db.js"
import { getKenvs } from "../core/utils.js"
import { createBinFromScript } from "./lib/utils.js"

let kenvs = await getKenvs()

await trash([
  `!${kenvPath("bin", ".gitignore")}`,
  kenvPath("bin", "*"),
])

for await (let kenv of kenvs) {
  await trash([
    `!${path.resolve(kenv, "bin", ".gitignore")}`,
    path.resolve(kenv, "bin", "*"),
  ])
}

await wait(200)
let scripts = await getScripts(false)
await wait(200)

for (let script of scripts) {
  await createBinFromScript(Bin.scripts, script)
}

export {}
