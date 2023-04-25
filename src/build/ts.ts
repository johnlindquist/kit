import { build } from "esbuild"
import {
  lstat,
  readdir,
  writeFile,
  readFile,
} from "fs/promises"
import os from "os"
import * as path from "path"

export let isFile = async (
  file: string
): Promise<boolean> => {
  try {
    let stats = await lstat(file)
    return stats.isFile()
  } catch {
    return false
  }
}

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
    /(?<=\s(npm|import)\(('|"))(.*)(?=('|")\))/g
  )

  if (Array.isArray(imports)) {
    external = external.concat(imports)
  }

  let writeErrorFile = async errorBody => {
    let name = path.basename(scriptPath)

    // if errorBody contains "Could not resolve", then we can
    // assume that the user is trying to import a package that
    // doesn't exist. We can then provide a helpful error message

    let errorScript = ``
    let mustInstall = ``

    let regex = /Could not resolve "([^"]+)"/
    let match = errorBody?.match(regex)

    if (match?.[1]) {
      mustInstall = match[1]
    }

    if (mustInstall) {
      errorScript = `
import "@johnlindquist/kit"      
await npmInstall("${mustInstall}")
log("${mustInstall}")
let contents = "${kitPath("build", "ts.js")} ${scriptPath}"

log({contents})
let runTxt = "${kitPath("run.txt")}"
await writeFile(runText, contents)

await wait(500)

await writeFile(runTxt, "${scriptPath}")

`
    } else {
      errorScript = `
      await div(md(\`# Failed to Compile ${name}
## Please fix the following errors and try again
      
      ${errorBody}
      
      ## Found npm packages:
      ${external.join("\n* ")}
      
      \`))
`
    }

    await writeFile(outfile, errorScript)
  }
  try {
    let kenvTSConfig = kenvPath("tsconfig.json")
    let kitTSConfig = kitPath("tsconfig.json")
    let hasKenvTSConfig = await isFile(kenvTSConfig)
    let tsconfig = hasKenvTSConfig
      ? kenvTSConfig
      : kitTSConfig
    let result = await build({
      entryPoints: [scriptPath],
      outfile,
      bundle: true,
      platform: "node",
      format: "esm",
      external,
      charset: "utf8",
      tsconfig,
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
