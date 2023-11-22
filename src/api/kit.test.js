import ava from "ava"
import os from "os"
import fs from "fs-extra"
import "../../test/config.js"

/** @type {import("./utils")} */
let { resolveToScriptPath } = await import(
  kitPath("core", "utils.js")
)

ava.serial(`testing "run" is global`, async t => {
  let otherScript = `mock-other-script`
  let mainScript = `mock-main-run-script`

  await $`KIT_MODE=js kit new ${otherScript} main --no-edit`
  await $`KIT_MODE=js kit new ${mainScript} main --no-edit`

  await appendFile(
    kenvPath("scripts", `${mainScript}.js`),
    `
    await run("${otherScript}")
    `
  )

  let { stdout, stderr } = await $`${kenvPath(
    "bin",
    mainScript
  )}`

  t.is(stderr, "")
})

ava.serial(`tmpPath generates a tmp path`, async t => {
  let script = `mock-tmp-path`
  let file = "taco.txt"

  let { stdout, stderr } = await testScript(
    script,
    `
    console.log(tmpPath("${file}"))    
    `
  )

  t.true(await pathExists(kenvPath("tmp", script)))
  t.is(
    stdout.trim(),
    path.resolve(os.tmpdir(), "kit", script, file)
  )
  t.is(stderr, "")
})

ava.serial(`npm installs a package`, async t => {
  let script = `mock-npm-install-express`

  let { stdout, stderr } = await testScript(
    script,
    `
    await npm("express")
    `
  )
  let pkg = await readJson(kenvPath("package.json"))

  t.truthy(pkg.devDependencies?.["express"])
  t.falsy(pkg.dependencies?.["express"])
})
