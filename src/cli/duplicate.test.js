import ava from "ava"
import "../../test/config.js"

ava.serial("kit duplicate", async t => {
  let command = `browse-scriptkit`
  let duplicate = `${command}-duplicated`
  let scriptPath = kenvPath("scripts", `${duplicate}.js`)
  let binPath = kenvPath("bin", `${duplicate}`)

  await $`KIT_MODE=js kit duplicate ${command} ${duplicate} main --no-edit`
  let scriptCreated = test("-f", scriptPath)
  let binCreated = test("-f", binPath)

  t.true(scriptCreated, `Duplicated ${command} script`)
  t.true(binCreated, `Duplicated ${command} bin`)
})

ava.serial("kit duplicate a typescript file", async t => {
  let command = `browse-scriptkit-typescript`
  await $`KIT_MODE=ts kit new ${command} main --no-edit`
  let duplicate = `${command}-duplicated`
  let scriptPath = kenvPath("scripts", `${duplicate}.ts`)
  let binPath = kenvPath("bin", `${duplicate}`)

  await $`KIT_MODE=ts kit duplicate ${command} ${duplicate} main --no-edit`
  let scriptCreated = test("-f", scriptPath)
  let binCreated = test("-f", binPath)

  t.true(scriptCreated, `Duplicated ${command} script`)
  t.true(binCreated, `Duplicated ${command} bin`)
})
