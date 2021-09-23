import ava from "ava"
import "../../test/config.js"

ava("kit duplicate", async t => {
  let command = `browse-scriptkit`
  let duplicate = `${command}-duplicated`
  let scriptPath = kenvPath("scripts", `${duplicate}.js`)
  let binPath = kenvPath("bin", `${duplicate}`)

  await $`KIT_MODE=js kit duplicate ${command} ${duplicate} home --no-edit`
  let scriptCreated = test("-f", scriptPath)
  let binCreated = test("-f", binPath)

  t.true(scriptCreated)
  t.true(binCreated)
})

ava("kit duplicate a typescript file", async t => {
  let command = `browse-scriptkit-typescript`
  await $`KIT_MODE=ts kit new ${command} home --no-edit`
  let duplicate = `${command}-duplicated`
  let scriptPath = kenvPath("scripts", `${duplicate}.ts`)
  let binPath = kenvPath("bin", `${duplicate}`)

  await $`KIT_MODE=ts kit duplicate ${command} ${duplicate} home --no-edit`
  let scriptCreated = test("-f", scriptPath)
  let binCreated = test("-f", binPath)

  t.true(scriptCreated)
  t.true(binCreated)
})
