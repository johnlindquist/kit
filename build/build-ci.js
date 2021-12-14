import "@johnlindquist/globals"
import shelljs from "shelljs"
import { platform } from "os"
import { dirname } from "path"
import { fileURLToPath } from "url"

let { cd, rm, cp } = shelljs

let kitPath = (...pathParts) =>
  path.resolve(
    dirname(dirname(fileURLToPath(import.meta.url))),
    ...pathParts
  )

console.log(kitPath())

rm("-rf", kitPath())
await ensureDir(kitPath("node", "bin"))

let installNode = exec(
  `./build/install-node.sh v17.2.0 --prefix '${kitPath(
    "node"
  )}'`
)

cp("-R", "./root/*", kitPath())
cp("-R", "./build", kitPath())
cp("-R", "./src/types", kitPath())

cp("*.md", kitPath())
cp("package*.json", kitPath())
cp("LICENSE", kitPath())

let { stdout: nodeVersion } = await exec(`node --version`)
console.log({ nodeVersion })
let { stdout: npmVersion } = await exec(`npm --version`)
console.log({ npmVersion })

await exec(`npm i`)

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
await exec(`node ./scripts/cjs-fix.js`)

cd(kitPath())
