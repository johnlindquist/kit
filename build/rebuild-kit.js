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

let options = {
  cwd: kitPath(),
  env: {
    PATH: `${knodePath("bin")}:${process.env.PATH}`,
  },
}

let downloads = Promise.all([
  exec(
    `node ./run/terminal.js ./cli/download-md.js`,
    options
  ),
  exec(
    `node ./run/terminal.js ./hot/download-hot.js`,
    options
  ),
])

await Promise.all([esm, dec, downloads])

console.log(`Write .kitignore`)
await writeFile(kitPath(".kitignore"), "*")
