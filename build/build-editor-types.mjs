// build/build-editor-types.ts
var nodeContent = ``;
var kitContent = ``;
var defs = (await readdir(path.resolve("src", "types"))).filter((f) => !f.includes("kit-editor"));
console.log(defs);
for (let def of defs) {
  kitContent += await readFile(path.resolve("src", "types", def), "utf8");
}
var globalTypesDir = path.resolve("node_modules", "@johnlindquist", "globals", "types");
var globalTypeDirs = (await readdir(globalTypesDir)).filter((dir) => !dir.endsWith(".ts"));
console.log(globalTypeDirs);
kitContent += await readFile(path.resolve(globalTypesDir, "index.d.ts"), "utf8");
for (let typeDir of globalTypeDirs) {
  kitContent += await readFile(path.resolve(globalTypesDir, typeDir, "index.d.ts"), "utf8");
}
kitContent = kitContent.replace(/import {(.|\n)*?} from ".*?"/gim, "");
kitContent = kitContent.replace(/export {(.|\n)*?}/gim, "");
await writeFile("./src/types/kit-editor.d.ts", nodeContent + kitContent, "utf8");
