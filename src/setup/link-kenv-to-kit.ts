let copyIfNotExists = async (p: string, dest: string) => {
  let exists = await isFile(dest)
  console.log({
    p,
    dest,
    exists: exists ? "true" : "false",
  })
  if (!exists) await copyFile(p, dest)
}

let writeIfNotExists = async (p: string, dest: string) => {
  if (!(await isFile(p))) await writeFile(p, dest)
}

let npmRc = `
registry=https://registry.npmjs.org
install-links=false
`.trim()

await writeIfNotExists(kenvPath(".npmrc"), npmRc)

// add install-links=false to kenv's .npmrc if it doesn't exist
let npmrcContent = await readFile(
  kenvPath(".npmrc"),
  "utf-8"
)
if (!npmrcContent.match(/^install-links=false$/gm)) {
  if (npmrcContent.split("\n").at(-1) !== "") {
    await appendFile(kenvPath(".npmrc"), "\n")
  }
  await appendFile(
    kenvPath(".npmrc"),
    `install-links=false`
  )
}

await cli("install", `"${kitPath()}"`)

export {}
