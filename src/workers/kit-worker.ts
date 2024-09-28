import { parentPort } from "node:worker_threads"
import { run } from "../core/utils.js"

parentPort?.on("message", async ({ filePath }) => {
	await run(filePath)

	parentPort?.postMessage({ filePath })
})
