import "@johnlindquist/globals"
import shelljs from "shelljs"
import path from "path"
import os from "os"
import { homedir, platform } from "os"
import { existsSync } from "fs"
import { rm } from "fs/promises"

let knodeVersion = `20.11.1`

let originalDir = process.cwd()

let { cd, cp } = shelljs

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

// check npm and node versions
let options = {
  cwd: kitPath(),
  env: {
    PATH: `${knodePath("bin")}:${process.env.PATH}`,
  },
}
// Log which node is running this script using process.version and the node path
console.log(
  `build-kit and target node ${knodeVersion}
  
Running with ${process.argv[0]} version  ${process.version}
Path to this script: ${process.argv[1]}
  `
)

let extractNode = async file => {
  // Install node-stream-zip if it's not already installed
  if (!existsSync("node_modules/node-stream-zip")) {
    await exec("npm i node-stream-zip")
  }

  let { default: StreamZip } = await import(
    "node-stream-zip"
  )

  try {
    // eslint-disable-next-line
    const zip = new StreamZip.async({ file })
    const fileName = path.parse(file).name
    console.log(
      `Extacting ${fileName} to ${knodePath("bin")}`
    )
    // node-18.18.2-win-x64
    await zip.extract(fileName, knodePath("bin"))
    await zip.close()
  } catch (error) {
    console.error({ error })
  }
}

let installNodeWin = async () => {
  let arch = process.arch === "x64" ? "x64" : "x86"

  let url = `https://nodejs.org/dist/v${knodeVersion}/node-v${knodeVersion}-win-${arch}.zip`
  let buffer = await download(url)

  let nodeZipFilePath = path.join(
    os.tmpdir(),
    path.basename(url)
  )
  console.log(`Downloaded ${url} to ${nodeZipFilePath}`)
  await writeFile(nodeZipFilePath, buffer)

  await extractNode(nodeZipFilePath)
}

let installNode = (
  platform() !== "win32"
    ? exec(
        `./build/install-node.sh -v ${knodeVersion} -P '${knodePath()}' -y`
      )
    : installNodeWin()
).catch(e => {
  console.error(e)
  process.exit(1)
})

if (existsSync(kitPath())) {
  console.log(`Found kit at ${kitPath()}, removing...`)
  await rm(kitPath(), { recursive: true, force: true })
}
await ensureDir(kitPath())

if (existsSync(knodePath())) {
  console.log(`Found node at ${knodePath()}, removing...`)
  // Check node version
  let { stdout: nodeVersion } = await exec(
    `node --version`,
    options
  )
  console.log(
    `Current knode version: ${nodeVersion}. Required version ${knodeVersion}`
  )
  if (nodeVersion.endsWith(knodeVersion)) {
    console.log(`Version match. Skipping re-install.`)
  } else {
    await rm(knodePath(), { recursive: true, force: true })
    console.log(`Installing node to ${knodePath()}...`)

    await installNode
  }
}
await ensureDir(knodePath())

cp("-R", "./root/.", kitPath())
cp("-R", "./build", kitPath())
cp("-R", "./src/types", kitPath())

cp("*.md", kitPath())
cp("package*.json", kitPath())
cp("LICENSE", kitPath())

let { stdout: nodeVersion } = await exec(
  `node --version`,
  options
)
let { stdout: npmVersion } = await exec(
  `npm --version`,
  options
)

console.log(`Node version: ${nodeVersion}`)
console.log(`NPM version: ${npmVersion}`)

console.log(`Building ESM to ${kitPath()}`)
let esm = exec(`npx tsc --outDir ${kitPath()}`).catch(e => {
  console.error(e)
  process.exit(1)
})

await esm

console.log(`Building declarations to ${kitPath()}`)
let dec = exec(
  `npx tsc --project ./tsconfig-declaration.json --outDir ${kitPath()}`
).catch(e => {
  console.error(e)
  process.exit(1)
})
await dec

console.log(`Install deps`)

await exec(`npm i --production`, options)

// console.log(`Install app deps`)
// await exec(`${npm} i @johnlindquist/kitdeps@0.1.1`)

console.log(`Download docs`)
await exec(
  `node ./run/terminal.js ./help/download-docs.js`,
  options
)

console.log(`Download hot`)
await exec(
  `node ./run/terminal.js ./hot/download-hot.js`,
  options
)

console.log(`Write .kitignore`)
await writeFile(kitPath(".kitignore"), "*")
cd(originalDir)
