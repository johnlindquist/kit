import ava from "ava"
import "../../test/config.js"

let command = `browse-scriptkit`
let duplicate = `script-with-arg-duplicated`
let scriptPath = kenvPath("scripts", `${duplicate}.js`)
let binPath = kenvPath("bin", `${duplicate}`)

ava.serial("kit duplicate", async t => {
  await $`kit duplicate ${command} ${duplicate} home --no-edit`
  let scriptCreated = test("-f", scriptPath)
  let binCreated = test("-f", binPath)

  t.true(scriptCreated)
  t.true(binCreated)
})

ava.serial("kit rm", async t => {
  await $`kit rm ${duplicate} --confirm`

  let fileRmed = !test("-f", scriptPath)
  let binRmed = !test("-f", binPath)

  t.true(fileRmed)
  t.true(binRmed)
})
