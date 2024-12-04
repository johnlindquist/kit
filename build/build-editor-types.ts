import path from "node:path"
import { readdir, readFile, writeFile } from "node:fs/promises"
import fsExtra from "fs-extra"
let { ensureDir } = fsExtra

let nodeContent = ``
let kitContent = ``

// exclude itself 😇

let kitDefs = await readdir(path.resolve("src", "types"))

for (let def of kitDefs) {
	kitContent += await readFile(path.resolve("src", "types", def), "utf8")
}

// let globalDefs = path.resolve(
// 	"node_modules",
// 	"@johnlindquist",
// 	"globals",
// 	"types"
// )

// let globalTypeDirs = (await readdir(globalDefs)).filter(
// 	(dir) => !dir.endsWith(".ts")
// )

// console.log({ defs: kitDefs, globalTypeDirs })

// GlobalsAPI
// kitContent += await readFile(path.resolve(globalDefs, "index.d.ts"), "utf8")

//       content = `declare module '@johnlindquist/kit' {

// ${content}

// }`

kitContent = kitContent.replace(/import {(.|\n)*?} from ".*?"/gim, "")

kitContent = kitContent.replace(/export {(.|\n)*?}/gim, "")

kitContent = `
declare module '@johnlindquist/kit' {
  ${kitContent}
}
`

let filePath = "./src/editor/types/kit-editor.d.ts"

await ensureDir(path.dirname(filePath))
await writeFile(filePath, nodeContent + kitContent, "utf8")

export {}
