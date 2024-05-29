import path from "path"
import { Bin } from "../core/enum.js"
import { createBinFromScript } from "../cli/lib/utils.js"
import { parentPort } from "worker_threads"
import type { Script } from "../types/core"

parentPort?.on("message", async filePath => {
  try {
    let command = path.parse(filePath).name

    await createBinFromScript(Bin.scripts, {
      filePath,
      command,
    } as Script)
    console.log(`Created bin from script: ${filePath}`)
  } catch (error) {
    console.log(
      `Error creating bin from script: ${filePath}`,
      error
    )
  }
  parentPort?.postMessage({ filePath })
})
