// Description: Clear Timestamps
import type { Script } from "../types/core"
import Bottleneck from "bottleneck"
import {
	getGroupedScripts,
	processScriptPreview,
	scriptFlags
} from "../api/kit.js"
import { Channel } from "../core/enum.js"
import { formatChoices } from "../core/utils.js"
import { parentPort } from "node:worker_threads"
import { type Stamp, getScriptsDb, getTimestamps } from "../core/db.js"
import { scriptsSort } from "../core/utils.js"

const getTimestampsDb = async (stamp: Stamp) => {
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

	return timestampsDb
}

const parseMainMenu = async (stamp: Stamp = null) => {
	if (stamp) {
		let [timestampsDb, scriptsDb] = await Promise.all([
			getTimestampsDb(stamp),
			getScriptsDb(false)
		])

		let script = scriptsDb.scripts.find((s) => s.filePath === stamp.filePath)

		if (script) {
			scriptsDb.scripts = scriptsDb.scripts.sort(
				scriptsSort(timestampsDb.stamps)
			)
			try {
				await scriptsDb.write()
			} catch (error) {}
		}
	}

	let groupedScripts = await getGroupedScripts(false)
	let scripts = formatChoices(groupedScripts)
	let firstScript = scripts.find((script) => !script.skip)
	let preview = ""
	try {
		preview = await processScriptPreview(firstScript as unknown as Script)()
	} catch (error) {
		console.error(error)
	}

	// Clone and remove all scriptFlags["key"].preview
	const sanitizedScriptFlags = Object.assign({}, scriptFlags) as object
	for (const key in sanitizedScriptFlags) {
		if (sanitizedScriptFlags?.[key]?.preview) {
			sanitizedScriptFlags[key].preview = undefined
		}
	}

	const sanitizedScripts = scripts.map((s) => {
		s.value = undefined
		s.preview = typeof s.preview === "function" ? undefined : s.preview
		return s
	})

	const message = {
		channel: Channel.CACHE_MAIN_SCRIPTS,
		scripts: sanitizedScripts,
		scriptFlags: sanitizedScriptFlags,
		preview
	}

	return message
}

const cacheMainScripts = async (stamp: Stamp) => {
	try {
		const message = await parseMainMenu(stamp)
		parentPort.postMessage(message)
	} catch (error) {
		console.error(error)
		parentPort.postMessage({
			channel: Channel.CACHE_MAIN_SCRIPTS,
			error,
			scripts: [],
			scriptFlags: {},
			preview: ""
		})
	}
}

const limiter = new Bottleneck({ maxConcurrent: 1 })
const limitedCacheMainScripts = limiter.wrap(cacheMainScripts)

const removeTimestamp = async (filePath: string) => {
	const stampDb = await getTimestamps()
	const stamp = stampDb.stamps.findIndex((s) => s.filePath === filePath)
	stampDb.stamps.splice(stamp, 1)
	await stampDb.write()

	await limitedCacheMainScripts(null)
}

const clearTimestamps = async () => {
	const stampDb = await getTimestamps()
	stampDb.stamps = []
	await stampDb.write()

	await limitedCacheMainScripts(null)
}

parentPort?.on(
	"message",
	({
		channel,
		value
	}: {
		channel: Channel
		value?: any
	}) => {
		if (channel === Channel.CACHE_MAIN_SCRIPTS) {
			limitedCacheMainScripts(value)
			return
		}

		if (channel === Channel.REMOVE_TIMESTAMP) {
			removeTimestamp(value)
			return
		}

		if (channel === Channel.CLEAR_TIMESTAMPS) {
			clearTimestamps()
			return
		}
	}
)
