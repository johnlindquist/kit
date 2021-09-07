console.log(`Starting postinstall`);
let tmpScriptsPath = kitPath("tmp", "scripts");
cp(kenvPath("scripts/*"), tmpScriptsPath);
export {};
