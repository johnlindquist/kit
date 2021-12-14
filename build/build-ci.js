import "@johnlindquist/globals"
import shelljs from "shelljs"

let { cd, cp } = shelljs

let kitPath = (...pathParts) =>
  path.resolve(process.env.KIT, ...pathParts)

console.log({ kitPath: kitPath() })

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

await Promise.all([esm, dec, cjs])
await exec(`node ./scripts/cjs-fix.js`)

cd(kitPath())
