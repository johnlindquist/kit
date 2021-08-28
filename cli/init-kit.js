let tree = await npm("tree-cli");
console.log(kenvPath("scripts"));
console.log(kitPath("scripts"));
let removeSrc = await isDir(kitPath("src"));
if (removeSrc) {
    await trash([kitPath("src")]);
}
let kitScriptsPath = kitPath("scripts");
cp(kenvPath("scripts/*"), kitScriptsPath);
let scripts = await readdir(kitScriptsPath);
console.log(scripts);
let scriptImports = scripts
    .filter(s => s.endsWith(".js"))
    .map(s => `\tawait import("./scripts/${s}")`)
    .join("\n");
let keepFn = `$1

async function keep(){
${scriptImports}
}
`;
console.log(keepFn);
let runFile = kitPath("run.js");
let contents = await readFile(runFile, "utf-8");
let replaced = contents.replace(/(codegen).*/gs, keepFn);
await writeFile(runFile, replaced);
console.log(`Tree Kit`);
let t = await tree({ base: kitPath(), l: 2 });
console.log(t?.report);
contents = await readFile(kitPath("run.js"), "utf-8");
console.log(contents);
export {};
