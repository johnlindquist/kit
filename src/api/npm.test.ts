import ava from "ava"

import tmp from "tmp-promise"
import { randomUUID } from "node:crypto"
import { join } from "node:path"
await import("../api/global.js")
await import("../api/kit.js")
await import("../api/pro.js")
await import("../api/lib.js")
await import("../platform/base.js")
await import("../target/terminal.js")

import { kenvPath } from "../core/utils.js"

// Create temp directory without automatic cleanup
// Temp directories are cleaned by the OS - automatic cleanup causes race conditions
// with AVA's async test execution (EBUSY on Windows, ENOTEMPTY on Linux)
const tmpDir = await tmp.dir({ unsafeCleanup: false })
process.env.KENV = tmpDir.path
process.env.KIT_CONTEXT = "workflow"
process.env.KENV = path.resolve(tmpDir.path, ".kenv")

ava.beforeEach(async (t) => {
	global.kitScript = `${randomUUID()}.js`
	global.__kitDbMap = new Map()

	await ensureDir(kenvPath())
	await ensureDir(kitPath())

	t.log({
		kenvPath: kenvPath(),
		kitPath: kitPath()
	})
})

ava("legacy npm import with title-case", async (t) => {
	try {
		await exec(`pnpm init`, {
			cwd: kenvPath()
		})
		await exec(`pnpm init`, {
			cwd: kitPath()
		})
	} catch (error) {
		// On Windows CI we sometimes see pnpm init fail with
		// ERR_PNPM_PACKAGE_JSON_EXISTS when package.json already exists.
		// That error is benign for this test; log rich context to aid triage.
		const e: any = error
		t.log({
			message: e?.message,
			exitCode: e?.exitCode,
			stdout: e?.stdout,
			stderr: e?.stderr,
			cwdKenv: kenvPath(),
			cwdKit: kitPath()
		})
	}
	console.log = t.log
	global.log = t.log
	flag.trust = true
	args.push("hello")
	let { titleCase } = await npm("title-case")
	let result = titleCase(await arg("Enter a string to title case:"))

	t.is(result, "Hello")
})
