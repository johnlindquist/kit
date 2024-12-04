import ava from "ava"
import "../core/utils.js"

ava("$ works", async t => {
  const message = "Hello, world!"
  let { stdout } = await $`echo ${message}`
  t.is(stdout, message)
})


ava("exec works", async t => {
  const message = "Hello, world!"
  let { stdout } = await exec(`echo ${message}`)
  t.is(stdout, message)
})

