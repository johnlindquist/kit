import "@johnlindquist/globals"
import shelljs from "shelljs"
import { homedir, platform } from "os"
import { existsSync } from "fs"

let { cd, rm, cp } = shelljs

let kitPath = (...pathParts) =>
  path.resolve(
    process.env.KIT || path.resolve(homedir(), ".kit"),
    ...pathParts
  )

let knodePath = (...parts) =>
  path.join(
    process.env.KNODE || path.resolve(homedir(), ".knode"),
    ...parts.filter(Boolean)
  )

if (existsSync(kitPath())) rm("-rf", kitPath())
await ensureDir(kitPath("node"))

let installNodeWin = async () => {
  let { Extract } = await import("unzipper")
  let { rename } = await import("fs/promises")
  let { rm } = shelljs

  rm("-rf", knodePath())

  await new Promise(r => {
    download(
      `https://nodejs.org/dist/v16.14.2/node-v16.14.2-win-x86.zip`
    )
      .pipe(Extract({ path: knodePath() }))
      .on("finish", r)
  })

  let nodeDir = await readdir(knodePath())
  let nodeDirName = nodeDir.find(n => n.startsWith("node-"))

  await rename(knodePath(nodeDirName), knodePath("bin"))
}

let installNode =
  platform() === "darwin"
    ? exec(
        `./build/install-node.sh v16.14.2 --prefix '${knodePath()}'`
      )
    : installNodeWin()

cp("-R", "./root/.", kitPath())
cp("-R", "./build", kitPath())
cp("-R", "./src/types", kitPath())

cp("*.md", kitPath())
cp("package*.json", kitPath())
cp("LICENSE", kitPath())

console.log(`Building ESM to ${kitPath()}`)
let esm = exec(`npx tsc --outDir ${kitPath()}`)

console.log(`Building declarations to ${kitPath()}`)
let dec = exec(
  `npx tsc --project ./tsconfig-declaration.json --outDir ${kitPath()}`
)

console.log(`Building CJS to ${kitPath()}`)
let cjs = exec(
  `npx tsc --project ./tsconfig-cjs.json --outDir "${kitPath(
    "cjs"
  )}"`
)

await Promise.all([installNode, esm, dec, cjs])
console.log(`Fix cjs`)
await exec(`node ./scripts/cjs-fix.js`)

cd(kitPath())
let npm = knodePath("bin", "npm")

console.log(`Install deps`)
await exec(`${npm} i --production`)

// console.log(`Install app deps`)
// await exec(`${npm} i @johnlindquist/kitdeps@0.1.1`)

console.log(`Downloading data`)
await exec(`node ./run/terminal.js ./help/download-docs.js`)
await exec(`node ./run/terminal.js ./hot/download-hot.js`)

console.log(`Write .kitignore`)
await writeFile(kitPath(".kitignore"), "*")
