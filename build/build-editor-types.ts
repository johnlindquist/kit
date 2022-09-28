let nodeContent = ``
let kitContent = ``

// exclude itself 😇

let defs = (
  await readdir(path.resolve("src", "types"))
).filter(f => !f.includes("kit-editor"))

console.log(defs)

for (let def of defs) {
  kitContent += await readFile(
    path.resolve("src", "types", def),
    "utf8"
  )
}

let globalTypesDir = path.resolve(
  "node_modules",
  "@johnlindquist",
  "globals",
  "types"
)

let globalTypeDirs = (await readdir(globalTypesDir)).filter(
  dir => !dir.endsWith(".ts")
)

console.log(globalTypeDirs)

// GlobalsAPI
kitContent += await readFile(
  path.resolve(globalTypesDir, "index.d.ts"),
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

await writeFile(
  "./src/types/kit-editor.d.ts",
  nodeContent + kitContent,
  "utf8"
)

export {}
