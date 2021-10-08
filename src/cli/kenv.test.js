import ava from "ava"
import "../../test/config.js"

let kenvName = `mock-kenv`
ava.serial("kenv create", async t => {
  await $`KIT_MODE=js kit kenv-create ${kenvName}`

  t.log(await readdir(kenvPath("kenvs")))

  t.true(await pathExists(kenvPath("kenvs", kenvName)))
})

ava.serial("kenv remove", async t => {
  await $`KIT_MODE=js kit kenv-rm ${kenvName}`

  t.log(await readdir(kenvPath("kenvs")))

  t.false(await pathExists(kenvPath("kenvs", kenvName)))
})
