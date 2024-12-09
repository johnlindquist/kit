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
import { writeJson, readJson, ensureDir } from "../globals/fs-extra.js"
import type { Choice, Script, PromptDb } from "../types/core"
import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"
import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods"
import type { Keyv } from "keyv"
import type { DBData, DBKeyOrPath, DBReturnType } from "../types/kit.js"

declare global {
	var __kitDbMap: Map<string, any>
	var __kitScriptsFromCache: boolean
	var __kitScriptCache: {
		lastParseTime?: number
		scripts?: Script[]
		fileStats?: Map<string, number>
	}
}

global.__kitDbMap = global.__kitDbMap || new Map()

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

	// Ensure directory exists
	await ensureDir(path.dirname(dbPath))

	let fileExists = await isFile(dbPath)

	let keyv = new Keyv({
		store: new KeyvFile({
			filename: dbPath
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

	if (typeof dataOrKeyOrPath === "string") {
		// Return cached database if available
		if (fromCache && global.__kitDbMap.has(dataOrKeyOrPath)) {
			return global.__kitDbMap.get(dataOrKeyOrPath)
		}

		if (dataOrKeyOrPath.includes("/") || dataOrKeyOrPath.includes("\\")) {
			dbPath = dataOrKeyOrPath
		} else {
			dbPath = kenvPath("db", `${dataOrKeyOrPath}.json`)
		}
	} else {
		// If no string key given, derive from global.kitScript
		const generatedKey = "_" + resolveScriptToCommand(global.kitScript)
		dbPath = kenvPath("db", `${generatedKey}.json`)
	}

	// Ensure directory exists before reading/writing
	await ensureDir(path.dirname(dbPath))

	let _db: Low<any>
	const jsonFile = new JSONFile(dbPath)
	const result = await jsonFile.read()
	_db = new Low(jsonFile, result)

	try {
		await _db.read()
	} catch (error) {
		global.warn?.(error)
		_db = new Low(jsonFile, result)
		await _db.read()
	}

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
			await _db.write()
		} catch (error) {
			global.log?.(error)
		}
	}

	const dbAPI = {
		dbPath,
		clear: async () => {
			await rm(dbPath, { force: true })
		},
		reset: async () => {
			await rm(dbPath, { force: true })
			await ensureDir(path.dirname(dbPath))
			_db = new Low(jsonFile, {})
			_db.data = await (async () => {
				if (typeof data === "function") {
					const d = await (data as () => Promise<T>)()
					return Array.isArray(d) ? { items: d } : d
				}
				return Array.isArray(data) ? { items: data } : data
			})()
			await _db.write()
		},
		async write() {
			await ensureDir(path.dirname(dbPath))
			return _db.write()
		},
		update(callback: (data: any) => void) {
			callback(_db.data)
			return this.write()
		}
	}

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
				(_db as any).data[key] = value
				return true
			} catch {
				return false
			}
		}
	})

	if (typeof dataOrKeyOrPath === "string") {
		global.__kitDbMap.set(dataOrKeyOrPath, dbProxy)
	}

	return dbProxy
}

global.db = db
global.store = store

global.__kitScriptCache = global.__kitScriptCache || {
	lastParseTime: 0,
	scripts: [],
	fileStats: new Map<string, number>()
}

export let parseScripts = async (ignoreKenvPattern = /^ignore$/) => {
	const scriptCache = global.__kitScriptCache
	let scriptFiles = await getScriptFiles()
	const kenvDirs = await getKenvs(ignoreKenvPattern)

	for (const kenvDir of kenvDirs) {
		const kenvScripts = await getScriptFiles(kenvDir)
		if (kenvScripts.length > 0) scriptFiles.push(...kenvScripts)
	}

	const existingFiles = new Set<string>(scriptFiles)
	const filesToParse: string[] = []

	for (const file of scriptFiles) {
		try {
			const { mtimeMs } = await (await import("fs")).promises.stat(file)
			const cachedMtime = scriptCache.fileStats.get(file)
			if (!cachedMtime || cachedMtime !== mtimeMs) {
				filesToParse.push(file)
				scriptCache.fileStats.set(file, mtimeMs)
			}
		} catch {}
	}

	if (scriptCache.scripts.length > 0) {
		scriptCache.scripts = scriptCache.scripts.filter(s =>
			existingFiles.has(s.filePath)
		)
	}

	if (filesToParse.length > 0) {
		const concurrency = 20
		const scriptInfoPromises = filesToParse.map(file => () => parseScript(file))
		const parseInBatches = async (tasks: (() => Promise<Script>)[], batchSize: number) => {
			const results: Script[] = []
			for (let i = 0; i < tasks.length; i += batchSize) {
				const batch = tasks.slice(i, i + batchSize).map(fn => fn())
				const res = await Promise.all(batch)
				results.push(...res)
			}
			return results
		}

		const newlyParsed = await parseInBatches(scriptInfoPromises, concurrency)

		const updatedMap = new Map(scriptCache.scripts.map(s => [s.filePath, s]))
		for (const script of newlyParsed) {
			updatedMap.set(script.filePath, script)
		}
		scriptCache.scripts = Array.from(updatedMap.values())

		let timestamps: Stamp[] = []
		try {
			let timestampsDb = await getTimestamps()
			timestamps = timestampsDb.stamps
		} catch {}

		scriptCache.scripts.sort(scriptsSort(timestamps))
	}

	return scriptCache.scripts
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

export let setScriptTimestamp = async (stamp: Stamp): Promise<Script[]> => {
	let timestampsDb = await getTimestamps()
	let index = timestampsDb.stamps.findIndex(s => s.filePath === stamp.filePath)

	let oldStamp = timestampsDb.stamps[index]

	stamp.timestamp = Date.now()
	if (stamp.runCount) {
		stamp.runCount = oldStamp?.runCount ? oldStamp.runCount + 1 : 1
	}
	if (oldStamp) {
		timestampsDb.stamps[index] = { ...oldStamp, ...stamp }
	} else {
		timestampsDb.stamps.push(stamp)
	}

	try {
		await timestampsDb.write()
	} catch (error) {
		if (global.log) global.log(error)
	}

	let scriptsDb = await getScriptsDb(false)
	let script = scriptsDb.scripts.find(s => s.filePath === stamp.filePath)

	if (script) {
		scriptsDb.scripts = scriptsDb.scripts.sort(scriptsSort(timestampsDb.stamps))
		try {
			await scriptsDb.write()
		} catch (error) {}
	}

	return scriptsDb.scripts
}

global.__kitScriptsFromCache = true
export let refreshScripts = async () => {
	await getScripts(false)
}

export let getPrefs = async () => {
	return await db(kitPath("db", "prefs.json"))
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
			s => s.name === script || s.command === script.replace(extensionRegex, "")
		)

		if (!result) {
			throw new Error(`Cannot find script based on name or command: ${script}`)
		}

		return result
	}
	let result = scripts.find(
		s => path.normalize(s.filePath) === path.normalize(script)
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
		} catch {
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