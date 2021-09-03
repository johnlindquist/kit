import ava from "ava"

import "../run.js"

ava.serial(
  "kit set-env-var KIT_TEMPLATE default",
  async t => {
    let envPath = kenvPath(".env")
    await $`kit set-env-var KIT_TEMPLATE default`
    let fileCreated = test("-f", envPath)

    t.true(fileCreated, process.env.KENV_DEV)
  }
)

let command = `kit-terminal-testing-new-ava`
let scriptPath = kenvPath("scripts", `${command}.js`)
let binPath = kenvPath("bin", `${command}`)

ava.serial("kit new", async t => {
  await $`kit new ${command} --no-edit`
  let scriptCreated = test("-f", scriptPath)
  let binCreated = test("-f", scriptPath)

  t.true(scriptCreated)
  t.true(binCreated)
})

ava.serial("kit rm", async t => {
  let { stdout, stderr } =
    await $`kit rm ${command} --confirm`

  console.log({ stdout, stderr })
  let fileRmed = !test("-f", scriptPath)
  let binRmed = !test("-f", binPath)

  t.true(fileRmed)
  t.true(binRmed)
})

ava.serial("kit hook", async t => {
  let message = "hello"
  let { value } = await kit(`script-with-export ${message}`)
  t.is(value, message)
})

ava.serial("clean .env", async t => {
  await trash(kenvPath(".env"))
  let fileRmed = !test("-f", kenvPath(".env"))

  t.true(fileRmed)
})
