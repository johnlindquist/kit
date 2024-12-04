import * as path from "node:path"
import { rm } from "node:fs/promises"
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
	processInBatches,
	parseSnippets
} from "./utils.js"

import { parseScript } from "./parser.js"

import { parseScriptlets } from "./scriptlets.js"

import { writeJson, readJson } from "../globals/fs-extra.js"

import type { Choice, Script, PromptDb } from "../types/core"
import { Low, JSONFile } from "@johnlindquist/kit-internal/lowdb"
import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods"
import type { Keyv } from "keyv"
import type { DBData, DBKeyOrPath, DBReturnType } from "../types/kit.js"

export const resolveKenv = (...parts: string[]) => {
	if (global.kitScript) {
		return path.resolve(global.kitScript, "..", "..", ...parts)
	}

	return kenvPath(...parts)
}

export let store = async (
	nameOrPath: string,
	initialData: object | (() => Promise<object>) = {}
): Promise<Keyv> => {
	let isPath = nameOrPath.includes("/") || nameOrPath.includes("\\")
	let { default: Keyv } = await import("keyv")
	let { KeyvFile } = await import("keyv-file")
	let dbPath = isPath ? nameOrPath : kenvPath("db", `${nameOrPath}.json`)

	let fileExists = await isFile(dbPath)

	let keyv = new Keyv({
		store: new KeyvFile({
			filename: dbPath
			// Not all options are required...
		} as any)
	})

	if (!fileExists) {
		let dataToInit: Record<string, any> = {}

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

export async function db<T>(
	dataOrKeyOrPath?: DBKeyOrPath<T>,
	data?: DBData<T>,
	fromCache = true
): Promise<DBReturnType<T>> {
	let dbPath = ""

	// If 'data' is undefined and 'dataOrKeyOrPath' is not a string,
	// treat 'dataOrKeyOrPath' as 'data' and generate a default key/path
	if (typeof data === "undefined" && typeof dataOrKeyOrPath !== "string") {
		data = dataOrKeyOrPath
		dataOrKeyOrPath = "_" + resolveScriptToCommand(global.kitScript)
	}

	// Handle case when 'dataOrKeyOrPath' is a string (key or path)
	if (typeof dataOrKeyOrPath === "string") {
		// Initialize or reset the cache map based on 'fromCache'
		global.__kitDbMap = fromCache ? global.__kitDbMap || new Map() : new Map()

		// Return cached database if available
		if (global.__kitDbMap.has(dataOrKeyOrPath)) {
			return global.__kitDbMap.get(dataOrKeyOrPath)
		}

		dbPath = dataOrKeyOrPath

		// Ensure the database file has a '.json' extension and resolve its full path
		if (!dbPath.endsWith(".json")) {
			dbPath = resolveKenv("db", `${dbPath}.json`)
		}
	}

	// Check if the parent directory of 'dbPath' exists
	const parentExists = await isDir(path.dirname(dbPath))
	if (!parentExists) {
		dbPath = kenvPath("db", `${path.basename(dbPath)}`)
		await ensureDir(path.dirname(dbPath))
	}

	let _db: Low<any>

	// Initialize the database
	const init = async () => {
		const jsonFile = new JSONFile(dbPath)
		const result = await jsonFile.read()
		_db = new Low(jsonFile, result)

		try {
			// Read existing data
			await _db.read()
		} catch (error) {
			// Log error and attempt to recover if possible
			global.warn?.(error)

			if (path.dirname(dbPath) === kitPath("db")) {
				// Attempt to reinitialize the database
				// await rm(dbPath); // This line is commented out in the original code
				_db = new Low(jsonFile, result)
				await _db.read()
			}
		}

		// If no data or not using cache, initialize with provided data
		if (!_db.data || !fromCache) {
			const getData = async () => {
				if (typeof data === "function") {
					const result = await (data as () => Promise<T>)()
					return Array.isArray(result) ? { items: result } : result
				}
				return Array.isArray(data) ? { items: data } : data
			}

			_db.data = await getData()

			try {
				// Write initial data to the database
				await _db.write()
			} catch (error) {
				global.log?.(error)
			}
		}
	}

	await init()

	// Define database API with additional methods
	const dbAPI = {
		dbPath,
		clear: async () => {
			await rm(dbPath)
		},
		reset: async () => {
			await rm(dbPath)
			await init()
		}
	}

	// Create a proxy to handle property access and modification
	const dbProxy = new Proxy(dbAPI as any, {
		get: (_target, key: string) => {
			if (key === "then") return _db
			if (key in dbAPI) {
				return typeof dbAPI[key] === "function"
					? dbAPI[key].bind(dbAPI)
					: dbAPI[key]
			}
			const dbInstance = _db as any
			if (dbInstance[key]) {
				return typeof dbInstance[key] === "function"
					? dbInstance[key].bind(dbInstance)
					: dbInstance[key]
			}
			return _db.data?.[key]
		},
		set: (_target: any, key: string, value: any) => {
			try {
				;(_db as any).data[key] = value
				// Optionally send data to a parent process if connected
				// if (process.send) {
				//   send(`DB_SET_${key}` as any, value);
				// }
				return true
			} catch (error) {
				return false
			}
		}
	})

	// Cache the database instance if a key/path is provided
	if (typeof dataOrKeyOrPath === "string") {
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

	let scriptInfo = await processInBatches(scriptInfoPromises, 5)

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
) => {
	let dbResult = await db<{
		scripts: Script[]
	}>(
		scriptsDbPath,
		async () => {
			const [scripts, scriptlets, snippets] = await Promise.all([
				parseScripts(ignoreKenvPattern),
				parseScriptlets(),
				parseSnippets()
			])
			return {
				scripts: scripts.concat(scriptlets, snippets) as Script[]
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

export let getTimestamps = async (fromCache = true) => {
	return await db<{
		stamps: Stamp[]
	}>(
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
export let getPrefsDb = async () => {
	return await db<PrefsDb>(prefsPath, { showJoin: true })
}

export let getPromptDb = async () => {
	return await db<PromptDb & { clear?: boolean }>(promptDbPath, {
		screens: {},
		clear: false
	})
}
