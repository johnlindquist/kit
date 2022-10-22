import { build } from "esbuild"
import { lstat, readdir } from "fs/promises"
import os from "os"
import * as path from "path"

export let home = (...pathParts: string[]) => {
  return path.resolve(os.homedir(), ...pathParts)
}

let kitPath = (...parts: string[]) =>
  path.join(
    process.env.KIT || home(".kit"),
    ...parts.filter(Boolean)
  )

// //app
let kenvPath = (...parts: string[]) => {
  return path.join(
    process.env.KENV || home(".kenv"),
    ...parts.filter(Boolean)
  )
}

let isDir = async (dir: string): Promise<boolean> => {
  try {
    let stats = await lstat(dir)

    return stats.isDirectory()
  } catch {
    return false
  }
}

let determineOutFile = (scriptPath: string) => {
  let tmpScriptName = path
    .basename(scriptPath)
    .replace(/\.(ts|jsx|tsx)$/, ".mjs")

  let dirName = path.dirname(scriptPath)
  let inScriptsDir = dirName.endsWith(path.sep + "scripts")
    ? ["..", ".scripts"]
    : []

  let outfile = path.join(
    scriptPath,
    "..",
    ...inScriptsDir,
    tmpScriptName
  )

  return outfile
}

let buildTSScript = async (scriptPath, outPath = "") => {
  let external = []
  let mainKenvNodeModulesPath = home(
    ".kenv",
    "node_modules"
  )
  let subKenvNodeModulesPath = kenvPath("node_modules")
  if (await isDir(mainKenvNodeModulesPath)) {
    external = external.concat(
      await readdir(mainKenvNodeModulesPath)
    )
  }

  if (
    subKenvNodeModulesPath !== mainKenvNodeModulesPath &&
    (await isDir(subKenvNodeModulesPath))
  ) {
    external = external.concat(
      await readdir(subKenvNodeModulesPath)
    )
  }

  let outfile = outPath || determineOutFile(scriptPath)
  await build({
    entryPoints: [scriptPath],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    external,
    charset: "utf8",
    tsconfig: kitPath(
      "templates",
      "config",
      "tsconfig.json"
    ),
  })
}

await buildTSScript(process.argv[2])
