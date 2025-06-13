import "./target/path/path.js"

import { URL, fileURLToPath } from "node:url"

let kitRun = async (command?: string, ..._args: string[]) => {
	process.env.KIT =
		process.env.KIT || path.dirname(fileURLToPath(new URL(import.meta.url)))

	await import("./api/global.js")
	await import("./api/kit.js")
	await import("./api/lib.js")
	await import("./target/terminal.js")

	if (command) {
		return await global.run(command, ..._args)
	}
}

if (!process?.env?.KIT_TARGET) {
	await kitRun()
}

export * from "./api/kit.js"
export * from "./api/tool.js"
export * from "./core/utils.js"


let dirs = ["cli", "main"]

let kitGet = (_target: any, key: string, _receiver: any) => {
	if ((global as any)[key] && !dirs.includes(key)) {
		return (global as any)[key]
	}

	try {
		return new Proxy(
			{},
			{
				get: async (_target, module: string, _receiver) => {
					let modulePath = `../${key}/${module}.js?${global.uuid()}`
					return await import(modulePath)
				}
			}
		)
	} catch (error) {
		console.warn(error)
	}
}

let kitDefault = new Proxy(kitRun, {
	get: kitGet
})

global.kit = kitDefault

export default kitDefault
