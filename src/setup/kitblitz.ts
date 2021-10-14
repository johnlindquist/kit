#!/bin/env node
import path from "path"

async function run() {
  let { outputJson } = await import("fs-extra")
  let $PROJECT = path.resolve(process.cwd())
  let contents = {
    installDependencies: true,
    startCommand:
      "kitbnode ./node_modules/@johnlindquist/kit/setup/kitblitz.js",
    env: {
      PATH: `${$PROJECT}/bin:${$PROJECT}/node_modules/@johnlindquist/kit/stackblitz/bin:/bin:/usr/bin:/usr/local/bin`,
    },
  }

  let sbrcPath = path.resolve($PROJECT, ".stackblitzrc")
  await outputJson(sbrcPath, contents)
}

run()
