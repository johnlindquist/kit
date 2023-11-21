import "@johnlindquist/globals"
import shelljs from "shelljs"
import { homedir } from "os"

let { cp } = shelljs

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

await Promise.all([esm, dec, cjs])
console.log(`Fix cjs`)
await exec(`node ./scripts/cjs-fix.js`)

console.log(`Write .kitignore`)
await writeFile(kitPath(".kitignore"), "*")
