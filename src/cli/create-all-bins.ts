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

let scripts = await getScripts(false)

for (let script of scripts) {
  await createBinFromScript(Bin.scripts, script)
  await wait(10)
}

export {}
