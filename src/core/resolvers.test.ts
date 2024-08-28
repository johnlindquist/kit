import ava from "ava"
import { homedir } from "node:os"
import * as path from "node:path"
import {
	createPathResolver,
	home,
	kitPath,
	kenvPath,
	kitDotEnvPath,
	knodePath
} from "./resolvers"

// Helper function to set up environment variables
const setupEnv = (env: Record<string, string | undefined>) => {
	const oldEnv = { ...process.env }
	for (const key of Object.keys(env)) {
		if (env[key] === undefined) {
			delete process.env[key]
		} else {
			process.env[key] = env[key]
		}
	}
	return () => {
		Object.assign(process.env, oldEnv)
	}
}

ava("createPathResolver", (t) => {
	const resolver = createPathResolver("/base/path")
	t.is(resolver("sub", "dir"), path.resolve("/base/path", "sub", "dir"))
})

ava("home", (t) => {
	t.is(home("test"), path.resolve(homedir(), "test"))
	t.is(home("sub", "dir"), path.resolve(homedir(), "sub", "dir"))
})

ava("kitPath with default KIT env", (t) => {
	const cleanup = setupEnv({ KIT: undefined })
	t.is(kitPath("test"), path.resolve(homedir(), ".kit", "test"))
	t.is(kitPath("sub", "dir"), path.resolve(homedir(), ".kit", "sub", "dir"))
	cleanup()
})

ava("kitPath with custom KIT env", (t) => {
	const cleanup = setupEnv({ KIT: "/custom/kit/path" })
	t.is(kitPath("test"), path.resolve("/custom/kit/path", "test"))
	t.is(kitPath("sub", "dir"), path.resolve("/custom/kit/path", "sub", "dir"))
	cleanup()
})

ava("kenvPath with default KENV env", (t) => {
	const cleanup = setupEnv({ KENV: undefined })
	t.is(kenvPath("test"), path.resolve(homedir(), ".kenv", "test"))
	t.is(kenvPath("sub", "dir"), path.resolve(homedir(), ".kenv", "sub", "dir"))
	cleanup()
})

ava("kenvPath with custom KENV env", (t) => {
	const cleanup = setupEnv({ KENV: "/custom/kenv/path" })
	t.is(kenvPath("test"), path.resolve("/custom/kenv/path", "test"))
	t.is(kenvPath("sub", "dir"), path.resolve("/custom/kenv/path", "sub", "dir"))
	cleanup()
})

ava("kitDotEnvPath with default KIT_DOTENV_PATH env", (t) => {
	const cleanup = setupEnv({ KIT_DOTENV_PATH: undefined, KENV: undefined })
	t.is(kitDotEnvPath(), home(".kenv", ".env"))
	cleanup()
})

ava("kitDotEnvPath with custom KIT_DOTENV_PATH env", (t) => {
	const cleanup = setupEnv({ KIT_DOTENV_PATH: "/custom/.env" })
	t.is(kitDotEnvPath(), "/custom/.env")
	cleanup()
})

ava("knodePath with default KNODE env", (t) => {
	const cleanup = setupEnv({ KNODE: undefined })
	t.is(knodePath("test"), path.resolve(homedir(), ".knode", "test"))
	t.is(knodePath("sub", "dir"), path.resolve(homedir(), ".knode", "sub", "dir"))
	cleanup()
})

ava("knodePath with custom KNODE env", (t) => {
	const cleanup = setupEnv({ KNODE: "/custom/knode/path" })
	t.is(knodePath("test"), path.resolve("/custom/knode/path", "test"))
	t.is(
		knodePath("sub", "dir"),
		path.resolve("/custom/knode/path", "sub", "dir")
	)
	cleanup()
})
