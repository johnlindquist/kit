import ava from "ava"
import "../../test/config.js"

/** @type {import("./utils")} */
let {
  resolveToScriptPath,
  kitPath,
  kenvPath,
  isDir,
  parseScript,
} = await import(
  path.resolve(`${process.env.KIT}`, "core", "utils.cjs")
)

/** @type {import("./db")} */
let { getScripts } = await import(
  path.resolve(`${process.env.KIT}`, "core", "db.cjs")
)

let testingParseScript = `testing-parse-script`

ava.serial("kitPath", async t => {
  t.true(_.isString(kitPath()), "kitPath is a string")
  t.true(
    kitPath().includes(path.sep),
    "kitPath has a path separator"
  )
})

ava.serial("isDir", async t => {
  t.truthy(await isDir(kitPath()))
  t.falsy(await isDir(kitPath("package.json")))
})

ava.serial("parseScript", async t => {
  await $`KIT_MODE=js kit new ${testingParseScript} main --no-edit`
  let scripts = await getScripts()
  let findScript = scripts.find(
    s => s.name === testingParseScript
  )

  let parsedScript = await parseScript(findScript.filePath)

  t.is(
    parsedScript.filePath,
    kenvPath("scripts", testingParseScript + ".js")
  )
})
