import * as path from "path"
import {
	kitPath,
	kenvPath,
	prefsPath,
	promptDbPath,
	isDir,
	isFile,
	extensionRegex,
	resolveScriptToCommand,
	scriptsSort,
	scriptsDbPath,
	statsPath,
	userDbPath,
	getScriptFiles,
	getKenvs,
	parseScript,
	processInBatches,
	parseScriptlets,
	parseSnippets
} from "./utils.js"

import { writeJson, readJson } from "@johnlindquist/kit-internal/fs-extra"

import type { Choice, Script, PromptDb } from "../types/core"
import { Low, JSONFile } from "@johnlindquist/kit-internal/lowdb"
import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods"

export const resolveKenv = (...parts: string[]) => {
	if (global.kitScript) {
		return path.resolve(global.kitScript, "..", "..", ...parts)
	}

	return kenvPath(...parts)
}

export let store = async (
	nameOrPath: string,
	initialData: any
): Promise<InstanceType<typeof import("keyv")>> => {
	let isPath = nameOrPath.includes("/") || nameOrPath.includes("\\")
	let { default: Keyv } = await import("keyv")
	let { KeyvFile } = await import("keyv-file")
	let dbPath = isPath ? nameOrPath : kenvPath("db", `${nameOrPath}.json`)

	let fileExists = await isFile(dbPath)

	let keyv = new Keyv({
		store: new KeyvFile({
			filename: dbPath
		})
	})

	if (!fileExists) {
		let dataToInit

		if (typeof initialData === "function") {
			dataToInit = await (initialData as () => Promise<any>)()
		} else {
			dataToInit = initialData
		}

		for await (let [key, value] of Object.entries(dataToInit)) {
			await keyv.set(key, value)
		}
	}

	return keyv
}

export let db = async <T = any>(
	dataOrKeyOrPath?: string | T | (() => Promise<T>),
	data?: T | (() => Promise<T>),
	fromCache = true
): Promise<Low & any> => {
	// global.__kitDbMap = global.__kitDbMap || new Map()
	if (typeof data === "undefined" && typeof dataOrKeyOrPath !== "string") {
		data = dataOrKeyOrPath
		dataOrKeyOrPath = "_" + resolveScriptToCommand(global.kitScript)
	}

	let dbPath = ""

	if (typeof dataOrKeyOrPath === "string") {
		if (fromCache) {
			global.__kitDbMap = global.__kitDbMap || new Map()
		} else {
			global.__kitDbMap = new Map()
		}
		if (global.__kitDbMap.has(dataOrKeyOrPath)) {
			return global.__kitDbMap.get(dataOrKeyOrPath)
		}

		dbPath = dataOrKeyOrPath
		if (!dataOrKeyOrPath.endsWith(".json")) {
			dbPath = resolveKenv("db", `${dataOrKeyOrPath}.json`)
		}
	}

	let parentExists = await isDir(path.dirname(dbPath))
	if (!parentExists) {
		console.warn(`Couldn't find ${path.dirname(dbPath)}. Returning defaults...`)
		return {
			...(data || {}),
			write: () => {}
		}
	}

	let _db
	let init = async () => {
		let jsonFile = new JSONFile(dbPath)
		let result = await jsonFile.read()
		_db = new Low(jsonFile, result)

		try {
			await _db.read()
		} catch (error) {
			// if dbPath dir is kitPath("db"), then delete the dbPath file and try again
			if (global?.warn) {
				try {
					global.warn(error)
				} catch (error) {}
			}

			if (path.dirname(dbPath) === kitPath("db")) {
				// await rm(dbPath)
				_db = new Low(jsonFile, result)
				await _db.read()
			}
		}

		if (!_db.data || !fromCache) {
			let getData = async () => {
				if (typeof data === "function") {
					let result = await (data as any)()
					if (Array.isArray(result)) return { items: result }

					return result
				}

				if (Array.isArray(data)) return { items: data }

				return data
			}

			_db.data = await getData()

			try {
				await _db.write()
			} catch (error) {
				if (global.log) {
					global.log(error)
				}
			}
		}
	}

	await init()

	let dbAPI = {
		dbPath,
		clear: async () => {
			await rm(dbPath)
		},
		reset: async () => {
			await rm(dbPath)
			await init()
		}
	}

	let dbProxy = new Proxy(dbAPI as any, {
		get: (_target, k: string) => {
			if (k === "then") return _db
			let d = _db as any
			if (d[k]) {
				if (typeof d[k] === "function") {
					return d[k].bind(d)

					// TODO: If connected to a parent process, send them as actions:
					if (process.send) {
						return (...args: any[]) => {
							return sendWait(`DB_GET_${k}` as any, ...args)
						}
					} else {
					}
				}
				return d[k]
			}
			return _db?.data?.[k]
		},
		set: (target: any, key: string, value: any) => {
			try {
				;(_db as any).data[key] = value
				// TODO: If connected to a parent process, send the values to the app
				// if (process.send) {
				//   send(`DB_SET_${key}` as any, value)
				// } else {
				// }

				return true
			} catch (error) {
				return false
			}
		}
	})

	if (dataOrKeyOrPath && typeof dataOrKeyOrPath === "string") {
		global.__kitDbMap.set(dataOrKeyOrPath, dbProxy)
	}

	return dbProxy
}

global.db = db
global.store = store

export let parseScripts = async (ignoreKenvPattern = /^ignore$/) => {
	let scriptFiles = await getScriptFiles()
	let kenvDirs = await getKenvs(ignoreKenvPattern)

	for await (let kenvDir of kenvDirs) {
		let scripts = await getScriptFiles(kenvDir)
		scriptFiles = [...scriptFiles, ...scripts]
	}

	let scriptInfoPromises = []
	for (const file of scriptFiles) {
		let asyncScriptInfoFunction = parseScript(file)

		scriptInfoPromises.push(asyncScriptInfoFunction)
	}

	let scriptInfo = await processInBatches(scriptInfoPromises, 10)

	let timestamps = []
	try {
		let timestampsDb = await getTimestamps()
		timestamps = timestampsDb.stamps
	} catch {}

	scriptInfo.sort(scriptsSort(timestamps))

	return scriptInfo
}

export let getScriptsDb = async (
	fromCache = true,
	ignoreKenvPattern = /^ignore$/
): Promise<
	Low & {
		scripts: Script[]
	}
> => {
	// if (!fromCache) console.log(`🔄 Refresh scripts db`)

	let dbResult = await db(
		scriptsDbPath,
		async () => {
			let scripts = await parseScripts(ignoreKenvPattern)
			let scriptlets = await parseScriptlets()
			let snippets = await parseSnippets()
			return {
				scripts: scripts.concat(scriptlets, snippets)
			}
		},
		fromCache
	)

	return dbResult
}

export let setScriptTimestamp = async (stamp: Stamp): Promise<Script[]> => {
	let timestampsDb = await getTimestamps()
	let index = timestampsDb.stamps.findIndex(
		(s) => s.filePath === stamp.filePath
	)

	let oldStamp = timestampsDb.stamps[index]

	stamp.timestamp = Date.now()
	if (stamp.runCount) {
		stamp.runCount = oldStamp?.runCount ? oldStamp.runCount + 1 : 1
	}
	if (oldStamp) {
		timestampsDb.stamps[index] = {
			...oldStamp,
			...stamp
		}
	} else {
		timestampsDb.stamps.push(stamp)
	}

	try {
		await timestampsDb.write()
	} catch (error) {
		if (global.log) global.log(error)
	}

	let scriptsDb = await getScriptsDb(false)
	let script = scriptsDb.scripts.find((s) => s.filePath === stamp.filePath)

	if (script) {
		scriptsDb.scripts = scriptsDb.scripts.sort(scriptsSort(timestampsDb.stamps))
		try {
			await scriptsDb.write()
		} catch (error) {}
	}

	return scriptsDb.scripts
}

// export let removeScriptFromDb = async (
//   filePath: string
// ): Promise<Script[]> => {
//   let scriptsDb = await getScriptsDb()
//   let script = scriptsDb.scripts.find(
//     s => s.filePath === filePath
//   )

//   if (script) {
//     scriptsDb.scripts = scriptsDb.scripts.filter(
//       s => s.filePath !== filePath
//     )
//     await scriptsDb.write()
//   }

//   return scriptsDb.scripts
// }

global.__kitScriptsFromCache = true
export let refreshScripts = async () => {
	await getScripts(false)
}

export let getPrefs = async () => {
	return await db(kitPath("db", "prefs.json"))
}

export type Stamp = {
	filePath: string
	timestamp?: number
	compileStamp?: number
	compileMessage?: string
	executionTime?: number
	changeStamp?: number
	exitStamp?: number
	runStamp?: number
	runCount?: number
}

export let getTimestamps = async (
	fromCache = true
): Promise<
	Low & {
		stamps: Stamp[]
	}
> => {
	return await db(
		statsPath,
		{
			stamps: []
		},
		fromCache
	)
}

export let getScriptFromString = async (script: string): Promise<Script> => {
	let scripts = await getScripts(false)

	if (!script.includes(path.sep)) {
		let result = scripts.find(
			(s) =>
				s.name === script || s.command === script.replace(extensionRegex, "")
		)

		if (!result) {
			throw new Error(`Cannot find script based on name or command: ${script}`)
		}

		return result
	}
	let result = scripts.find(
		(s) => path.normalize(s.filePath) === path.normalize(script)
	)

	if (!result) {
		throw new Error(`Cannot find script based on path: ${script}`)
	}

	return result
}

export let getScripts = async (
	fromCache = true,
	ignoreKenvPattern = /^ignore$/
) => {
	global.__kitScriptsFromCache = fromCache
	return (await getScriptsDb(fromCache, ignoreKenvPattern)).scripts
}

export type ScriptValue = (
	pluck: keyof Script,
	fromCache?: boolean
) => () => Promise<Choice<string>[]>

export let scriptValue: ScriptValue = (pluck, fromCache) => async () => {
	let menuItems: Script[] = await getScripts(fromCache)

	return menuItems.map((script: Script) => ({
		...script,
		value: script[pluck]
	}))
}

export type AppDb = {
	version: string
	openAtLogin: boolean
	previewScripts: boolean
	autoUpdate: boolean
	tray: boolean
	authorized: boolean
	searchDebounce?: boolean
	termFont?: string
	convertKeymap?: boolean
	cachePrompt?: boolean
	mini?: boolean
	disableGpu?: boolean
	disableBlurEffect?: boolean
}

export type UserDb = Partial<
	RestEndpointMethodTypes["users"]["getAuthenticated"]["response"]["data"]
>

export let setUserJson = async (user: UserDb) => {
	await writeJson(userDbPath, user)
}

export let getUserJson = async (): Promise<UserDb> => {
	let user: any = {}
	let userDbExists = await isFile(userDbPath)
	if (userDbExists) {
		try {
			user = await readJson(userDbPath)
		} catch (error) {
			await setUserJson({})
			user = {}
		}
	}

	return user
}

type PrefsDb = {
	showJoin: boolean
}
export let getPrefsDb = async (): Promise<Low<any> & PrefsDb> => {
	return await db(prefsPath, { showJoin: true })
}

export let getPromptDb = async (): Promise<Low<any> & PromptDb> => {
	return await db(promptDbPath, {
		screens: {},
		clear: false
	})
}
