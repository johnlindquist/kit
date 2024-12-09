import path from "node:path"
import { ensureDir, pathExists, readFile, writeFile } from "../../src/globals/index"

export async function loadPreviousResults(filename: string = getBenchmarkFilename()) {
    if (!await pathExists(filename)) return {}
    return JSON.parse(await readFile(filename, 'utf8'))
  }
  
export async function saveResults(results: any, filename: string = getBenchmarkFilename()) {
    await ensureDir(path.dirname(filename))
    await writeFile(filename, JSON.stringify(results, null, 2), 'utf8')
}

export function getBenchmarkFilename() {
    return path.join(process.env.HOME, ".benchmarks", `${
        new URL(import.meta.url).pathname.split('/').pop()?.replace(/\.test\.ts$/, '-benchmark.json')
    }`)
}
