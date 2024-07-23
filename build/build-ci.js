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

let env = {
  CI: true,
  ...process.env
}

console.log(`Building ESM to ${kitPath()}`)
try {
  await exec(`npm i`, { env })
  let esm = await exec(`npx tsc --outDir ${kitPath()}`, { env })
  console.log(esm)
} catch (e) {
  console.log(e)
  exit(1)
}

console.log(`Building declarations to ${kitPath()}`)
try {
  let dec = await exec(
    `npx tsc --project ./tsconfig-declaration.json --outDir ${kitPath()}`,
    { env }
  )
  console.log(dec)
} catch (e) {
  console.log(e)
  exit(1)
}

console.log(`Building editor types to ${kitPath()}`)
try {
  let editorTypes = await exec(`npx tsx ./build/build-editor-types.ts`, { env })
  console.log(editorTypes)
} catch (e) {
  console.log(e)
  exit(1)
}

cd(kitPath())
