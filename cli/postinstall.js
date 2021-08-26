console.log(`Starting postinstall`);
console.log(kitPath("src"));
await trash(kitPath("src", "*"));
let tmpScriptsPath = kitPath("tmp", "scripts");
if (!(await isDir(tmpScriptsPath))) {
    console.log(`Creating ${tmpScriptsPath}`);
    mkdir("-p", tmpScriptsPath);
}
cp("-r", kenvPath("scripts"), tmpScriptsPath);
console.log(kenvPath("scripts"));
export {};
