let kitScriptsPath = kitPath("scripts");
cp(kenvPath("scripts"), kitScriptsPath);
let scripts = await readdir(kitScriptsPath);
let scriptImports = scripts
    .filter(s => s.endsWith(".js"))
    .map(s => `await import("./scripts/${s}")`)
    .join("\n");
let keepFn = `$1

async function keep(){
    ${scriptImports}
}
`;
let runFile = "./run.js";
let contents = await readFile(runFile, "utf-8");
let replaced = contents.replace(/(codegen).*/gs, keepFn);
await writeFile(runFile, replaced);
export {};
