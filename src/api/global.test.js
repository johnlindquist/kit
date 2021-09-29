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
