#!/usr/bin/env node

import { pathExists } from "fs-extra"
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

process.env.KIT = path.resolve(
  projectRoot,
  "node_modules",
  "@johnlindquist",
  "kit"
)
process.env.KENV = projectRoot

import { configEnv } from "../core/utils.js"

await import("../api/global.js")
await import("../api/kit.js")
await import("../api/lib.js")

await import(`../platform/stackblitz.js`)

configEnv()

await import("../target/terminal.js")
let { runCli } = await import("../cli/kit.js")

let pkgJsonPath = path.resolve(projectRoot, "package.json")

let confirmArg = async message =>
  await arg(message, [
    { name: "No", value: false },
    { name: "Yes", value: true },
  ])

let pkgJson = await readJson(pkgJsonPath)
if (pkgJson?.type !== "module") {
  let confirm = await confirmArg(
    `package.json "type" needs to be set to "module". Proceed?`
  )

  if (confirm) {
    await writeJson(
      pkgJsonPath,
      {
        type: "module",
        ...pkgJson,
      },
      { spaces: "\t" }
    )
  } else {
    exit()
  }
}

let stackblitzRcPath = path.resolve(".stackblitzrc")
let stackblitzRcExists = await pathExists(stackblitzRcPath)

if (!stackblitzRcExists) {
  let confirm = await confirmArg(
    "Need to create .stackblitzrc and add ./bin to PATH. Proceed?"
  )

  if (confirm) {
    let config = {
      installDependencies: true,
      startCommand: "./node_modules/.bin/kitblitz",
      env: {
        PATH: `/bin:/usr/bin:/usr/local/bin:${projectRoot}/bin`,
      },
    }

    await outputJson(stackblitzRcPath, config, {
      spaces: "\t",
    })
  }
} else {
  let rc = await readJson(stackblitzRcPath)
  if (!rc?.env?.PATH.includes(`${projectRoot}/bin`)) {
    let confirm = await confirmArg(
      "Need to add ./bin to .stackblitzrc. Proceed?"
    )

    let existingPath = rc?.env?.PATH || ""
    if (existingPath.match(":/home/projects")) {
      existingPath = existingPath.replace(
        /:\/home\/projects\/.*?\/bin/,
        ""
      )
    }
    if (confirm) {
      let config = _.merge(rc, {
        installDependencies: true,
        startCommand: "./node_modules/.bin/kitblitz",
        env: {
          PATH: `${existingPath}:${projectRoot}/bin`,
        },
      })

      await outputJson(stackblitzRcPath, config, {
        spaces: "\t",
      })

      if (await pathExists(kenvPath("bin"))) {
        await cli("create-all-bins")
      }
    }
  }
}

await runCli()
