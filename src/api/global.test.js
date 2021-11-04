import ava from "ava"
import fs from "fs"
import "../../test/config.js"

/** @type {import("./utils")} */
let { resolveToScriptPath } = await import(
  kitPath("core", "utils.js")
)

ava.serial(
  `env should work with different params`,
  async t => {
    let name = `mock-env-message`
    let content = `
    await env("MOCK_ENV_MESSAGE", "Enter a value:")    
    `
    let type = "js"

    await $`KIT_MODE=${type} kit new ${name} home --no-edit`

    await appendFile(
      kenvPath("scripts", `${name}.js`),
      content
    )

    let p = $`${kenvPath("bin", name)}`

    p.stdin.write("Some value\n")

    let { stdout } = await p

    t.regex(stdout, /env/)
  }
)

ava(`All globals exist`, async t => {
  // TODO: Make platform independent...
  /** @type {import("../platform/darwin")} */
  await import(kitPath("platform", "darwin.js"))
  await import(kitPath("target", "app.js"))
  await import(kitPath("index.js"))

  let files = await readdir(kitPath("types"))
  let content = ``
  for await (let f of files) {
    content += await readFile(kitPath("types", f), "utf-8")
  }

  let matches = content.match(/(?<=var ).*?(?=:)/gim)

  for (let m of matches) {
    t.true(
      typeof global[m] !== "undefined",
      `${m} is missing`
    )
  }
})
