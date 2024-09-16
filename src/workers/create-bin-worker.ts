import path from "node:path"
import { Bin } from "../core/enum.js"
import { createBinFromScript } from "../cli/lib/utils.js"
import { parentPort } from "node:worker_threads"
import type { Script } from "../types/core"

const batchSize = 5 // Adjust this value based on your performance needs
let queue: Array<{ command: string; filePath: string }> = []

async function processBatch() {
	const batch = queue.splice(0, batchSize)
	const results = await Promise.all(
		batch.map(async ({ command, filePath }) => {
			try {
				await createBinFromScript(Bin.scripts, {
					filePath,
					command
				} as Script)
				return { success: true, filePath, command }
			} catch (error) {
				console.log(
					`Worker: Error creating bin from script: ${filePath} -> ${command}`,
					error
				)
				return { success: false, filePath, command, error }
			}
		})
	)

	results.forEach(result => {
		parentPort?.postMessage(result)
	})

	if (queue.length > 0) {
		await processBatch()
	}
}

parentPort?.on("message", ({ command, filePath }) => {
	queue.push({ command, filePath })
	if (queue.length === batchSize) {
		processBatch()
	}
})

// Process any remaining items in the queue when the worker is about to exit
process.on('beforeExit', () => {
	if (queue.length > 0) {
		processBatch()
	}
})
