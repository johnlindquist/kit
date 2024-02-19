import "@johnlindquist/globals"
import { exit } from "process"
import shelljs from "shelljs"

let { cd, cp } = shelljs

let kitPath = (...pathParts) =>
  path.resolve(process.env.KIT, ...pathParts)

console.log({ kitPath: kitPath() })

cp("-R", "./root/.", kitPath())
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
try {
  await exec(`npm i`)
  let esm = await exec(`npx tsc --outDir ${kitPath()}`)
  console.log(esm)
} catch (e) {
  console.log(e)
  exit(1)
}

console.log(`Building declarations to ${kitPath()}`)
try {
  let dec = await exec(
    `npx tsc --project ./tsconfig-declaration.json --outDir ${kitPath()}`
  )
  console.log(dec)
} catch (e) {
  console.log(e)
  exit(1)
}

cd(kitPath())
