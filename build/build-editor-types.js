let defs = await readdir(path.resolve("src", "types"));
let content = ``;
for (let def of defs) {
    content += await readFile(path.resolve("types", def), "utf8");
}
let globalTypesDir = path.resolve("node_modules", "@johnlindquist", "globals", "types");
let globalTypeDirs = (await readdir(globalTypesDir)).filter(dir => !dir.endsWith(".ts"));
let nodeTypesDir = path.resolve("node_modules", "@types", "node");
let nodeTypeFiles = (await readdir(nodeTypesDir)).filter(f => f.endsWith(".d.ts"));
content += await readFile(path.resolve(globalTypesDir, "index.d.ts"), "utf8");
//       content = `declare module '@johnlindquist/kit' {
// ${content}
// }`
for (let typeDir of globalTypeDirs) {
    content += await readFile(path.resolve(globalTypesDir, typeDir, "index.d.ts"), "utf8");
}
for (let file of nodeTypeFiles) {
    content += await readFile(path.resolve(nodeTypesDir, file), "utf8");
}
content = content.replace(/import {(.|\n)*?} from ".*?"/gim, "");
content = content.replace(/export {(.|\n)*?}/gim, "");
await writeFile("./src/types/kit-editor.d.ts", content, "utf8");
export {};
