import ava from "ava"
import "../../test-sdk/config.js"
import { pathToFileURL } from "node:url"

let kenvName = "mock-kenv"
ava.serial("kenv create", async (t) => {
	let { stdout } = await exec(`kit kenv-create ${kenvName}`, {
		env: {
			...process.env,
			KIT_MODE: "js"
		}
	})

	let kenvsPath = kenvPath("kenvs")
	let kenvsPathFileUrl = path.join(kenvsPath, kenvName)

	t.log({ stdout, kenvsPath })

	let kenvs = await readdir(kenvsPath)
	let kenvExists = await pathExists(kenvsPathFileUrl)
	t.log({ kenvs, kenvExists })

	t.true(kenvExists)
})

ava.serial("kenv remove", async (t) => {
	await exec(`kit kenv-rm ${kenvName}`, {
		env: {
			...process.env,
			KIT_MODE: "js"
		}
	})

	let kenvs = await readdir(kenvPath("kenvs"))
	let kenvExists = await pathExists(kenvPath("kenvs", kenvName))
	t.log({ kenvs, kenvExists })

	t.false(kenvExists)
})
