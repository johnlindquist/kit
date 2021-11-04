#!/usr/bin/env node

import { Bin } from "../core/enum.js"
import { getScripts } from "../core/db.js"
import { createBinFromScript } from "../core/utils.js"
import path from "path"

let filePath = path.dirname(
  new URL(import.meta.url).pathname
)
let projectRoot = path.resolve(
  filePath, // bin
  "..", // kit
  "..", // @johnlindquist
  "..", // node_modules
  ".." // project
)

process.env.KIT = path.resolve(filePath, "..")
process.env.KENV = projectRoot

import { configEnv } from "../core/utils.js"

await import("../api/global.js")
await import("../api/kit.js")
await import("../api/lib.js")

await import(`../platform/stackblitz.js`)

configEnv()

await import("../target/terminal.js")
let { runCli } = await import("../cli/kit.js")

let stackblitzRcPath = path.resolve(".stackblitzrc")
let stackblitzRcExists = await pathExists(stackblitzRcPath)

if (flag?.start) {
  await writeFile(
    path.resolve(projectRoot, ".env"),
    `KIT_TEMPLATE=default
`
  )
  let nmBinDir = path.resolve(
    projectRoot,
    "node_modules",
    ".bin"
  )
  // await $`rm ${path.resolve(nmBinDir, "kit")}`
  await $`mv ${path.resolve(
    nmBinDir,
    "kitblitz"
  )} ${path.resolve(nmBinDir, "kit")}`
  let kitPkgJsonPath = path.resolve(
    projectRoot,
    "node_modules",
    "@johnlindquist",
    "kit",
    "package.json"
  )

  let kitPkgJson = await readJson(kitPkgJsonPath)
  kitPkgJson.bin.kit = kitPkgJson.bin.kitblitz
  await writeJson(kitPkgJsonPath, kitPkgJson, {
    spaces: "\t",
  })
}

let config = {
  installDependencies: true,
  startCommand: "./node_modules/.bin/kitblitz --start",
}

if (!stackblitzRcExists) {
  await outputJson(stackblitzRcPath, config, {
    spaces: "\t",
  })
} else {
  let rc = await readJson(stackblitzRcPath)
  if (!rc?.env?.PATH.includes(`${projectRoot}/bin`)) {
    let existingPath = rc?.env?.PATH || ""
    if (existingPath.match(":/home/projects")) {
      existingPath = existingPath.replace(
        /:\/home\/projects\/.*?\/bin/,
        ""
      )
    }

    await outputJson(stackblitzRcPath, config, {
      spaces: "\t",
    })

    let scripts = await getScripts(false)

    for (let script of scripts) {
      await createBinFromScript(Bin.scripts, script)
    }
  }
}

await runCli()

if (flag?.start) {
  console.log(
    chalk`
Run "{green.bold kit}" to open this menu again.
`
  )
}
