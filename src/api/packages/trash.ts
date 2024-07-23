import { globby } from "globby"
import { Channel } from "../../core/enum.js"
import fs from "node:fs"
import { rimraf } from "rimraf"

export interface Options {
  readonly glob?: boolean
}

export default async function trash(
  input: string | readonly string[],
  options: Options = { glob: true }
): Promise<void> {
  // Normalize input to an array of strings
  const inputs = Array.isArray(input) ? input : [input]

  // Use globby to match files if glob option is enabled
  const pathsToTrash = options.glob
    ? await globby(inputs.map((input) => input.replace(/\\/g, "/")))
    : inputs

  if (process.env.KIT_CONTEXT === "app") {
    return await sendWaitLong(Channel.TRASH, pathsToTrash)
  }

  // Iterate over each path
  for (const item of pathsToTrash) {
    // Make sure the path exists
    const stats = await lstat(item)
    if (!stats) {
      throw new Error(`Path does not exist: ${item}`)
    }

    // Check if the path is a directory or a file
    if (stats.isDirectory()) {
      // Delete directory and its content
      await rimraf(item)
    } else {
      // Delete file
      await fs.promises.unlink(item)
    }
  }
}

global.trash = trash
global.rm = trash

export {}
