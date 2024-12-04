import { readFile, writeFile } from "node:fs/promises"
import { ensureFile, pathExists, readJson, writeJson } from "./fs-extra.js"

type ReadFileOptions = Parameters<typeof readFile>[1]

export type EnsureReadFile = (path: string, defaultContent?: string, options?: ReadFileOptions) => Promise<string>

export type EnsureReadJson = 
  <T>(path: string, defaultContent: T, options?: Parameters<typeof readJson>[1]) => Promise<T>

export let ensureReadFile = async (
  pathLike: string,
  defaultContent = "",
  options = { encoding: "utf-8" } as Parameters<typeof readFile>[1]
) => {
  await ensureFile(pathLike)
  if (defaultContent) {
    let readContent = await readFile(pathLike, options)
    if (!readContent) {
      await writeFile(pathLike, defaultContent)
      return defaultContent
    }
  }

  return (await readFile(pathLike, options)) as string
}

export let ensureReadJson = async <T>(
  pathLike: string,
  defaultContent: T,
  options?: Parameters<typeof readJson>[1]
): Promise<T> => {
  if (await pathExists(pathLike)) {
    return await readJson(pathLike, options)
  }

  await ensureFile(pathLike)
  await writeJson(pathLike, defaultContent)
  return defaultContent
}

global.ensureReadFile = ensureReadFile
global.ensureReadJson = ensureReadJson
