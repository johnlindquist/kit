import path from "node:path"
import { Bin } from "../core/enum.js"
import { createBinFromScript } from "../cli/lib/utils.js"
import { parentPort } from "node:worker_threads"
import type { Script } from "../types/core.ts"

parentPort?.on(
  "message",
  async ({ command, filePath, execPath }) => {
    try {
      await createBinFromScript(Bin.scripts, {
        filePath,
        command,
        execPath,
      } as Script & { execPath: string })
      // console.log(`Worker: Created bin from script: ${filePath} -> ${command}`)
    } catch (error) {
      console.log(
        `Worker: Error creating bin from script: ${filePath} -> ${command}`,
        error
      )
    }
    parentPort?.postMessage({ filePath, command })
  }
)
