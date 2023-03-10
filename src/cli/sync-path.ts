import { readFile, writeFile } from "fs/promises"
let args = process.argv.slice(2)

let envPath = args[0]
let contents = await readFile(envPath, "utf8")

// If contents has a PATH variable, the update it.
// Otherwise, append it to the end of the file.

if (contents.includes("PATH=")) {
  contents = contents.replace(
    /^PATH=.*$/gm,
    `PATH=${process.env.PATH}`
  )
} else {
  contents += `
PATH=${process.env.PATH}
`
}

await writeFile(envPath, contents)
