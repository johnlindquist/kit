import "@johnlindquist/globals"
import shelljs from "shelljs"
import { homedir } from "os"

let { cd, rm, mkdir, cp } = shelljs

let kitPath = (...pathParts) =>
  path.resolve(
    process.env.KIT || path.resolve(homedir(), ".kit"),
    ...pathParts
  )

rm("-rf", kitPath())
await ensureDir(kitPath("node", "bin"))

cp(
  "-R",
  "/Program Files(x86)/nodejs/*",
  kitPath("node", "bin")
)

cp("-R", "./root/*", kitPath())
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
await exec(`node ./scripts/cjs-fix.js`)

cd(kitPath())

await exec(`npm i --production`)

await exec(`node ./run/terminal.js ./help/download-docs.js`)
await exec(`node ./run/terminal.js ./hot/download-hot.js`)

await writeFile(kitPath(".kitignore"), "*")
