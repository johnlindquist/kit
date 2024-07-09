import ava from "ava"
import "../../test-sdk/config.js"

let kenvName = "mock-kenv"
ava.serial("kenv create", async (t) => {
	let { stdout } = await $`KIT_MODE=js kit kenv-create ${kenvName}`

	t.log({ stdout })

	let kenvs = await readdir(kenvPath("kenvs"))
	let kenvExists = await pathExists(kenvPath("kenvs", kenvName))
	t.log({ kenvs, kenvExists })

	t.true(kenvExists)
})

ava.serial("kenv remove", async (t) => {
	await $`KIT_MODE=js kit kenv-rm ${kenvName}`

	let kenvs = await readdir(kenvPath("kenvs"))
	let kenvExists = await pathExists(kenvPath("kenvs", kenvName))
	t.log({ kenvs, kenvExists })

	t.false(kenvExists)
})
