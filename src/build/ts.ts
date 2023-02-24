import { build } from "esbuild"
import { lstat, readdir, writeFile } from "fs/promises"
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

  let contents = await readFile(scriptPath, "utf-8")
  // find all imports inside of the npm() function
  let imports = contents.match(
    /(?<=\snpm\(('|"))(.*)(?=('|")\))/g
  )

  if (Array.isArray(imports)) {
    external = external.concat(imports)
  }

  let writeErrorFile = async errorBody => {
    let name = path.basename(scriptPath)
    let errorScript = `
await div(md(\`# Failed to Compile ${name}
## Please fix the following errors and try again

${errorBody}

## Found npm packages:
${external.join("\n* ")}

\`))
    `
    await writeFile(outfile, errorScript)
  }
  try {
    let result = await build({
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
    if (result?.errors?.length) {
      await writeErrorFile(
        result.errors.map(e => e.text).join("\n")
      )
    }
  } catch (error) {
    await writeErrorFile(
      error?.message || error?.toString() || error
    )
  }
}

await buildTSScript(process.argv[2])
