import path from "path"
let nodeContent = ``
let kitContent = ``

// exclude itself 😇

let kitDefs = (
  await readdir(path.resolve("src", "types"))
).filter(f => !f.includes("kit-editor"))

for (let def of kitDefs) {
  kitContent += await readFile(
    path.resolve("src", "types", def),
    "utf8"
  )
}

let globalDefs = path.resolve(
  "node_modules",
  "@johnlindquist",
  "globals",
  "types"
)

let globalTypeDirs = (await readdir(globalDefs)).filter(
  dir => !dir.endsWith(".ts")
)

console.log({ defs: kitDefs, globalTypeDirs })

// GlobalsAPI
kitContent += await readFile(
  path.resolve(globalDefs, "index.d.ts"),
  "utf8"
)

//       content = `declare module '@johnlindquist/kit' {

// ${content}

// }`

kitContent = kitContent.replace(
  /import {(.|\n)*?} from ".*?"/gim,
  ""
)

kitContent = kitContent.replace(/export {(.|\n)*?}/gim, "")

kitContent = `
declare module '@johnlindquist/kit' {
  ${kitContent}
}
`

await writeFile(
  "./src/types/kit-editor.d.ts",
  nodeContent + kitContent,
  "utf8"
)

export {}
