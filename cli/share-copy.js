//Menu: Copy Script to Clipboard
//Description: Copies Script to Clipboard
let { menu } = await cli("fns");
let script = await arg(`Which script do you want to share?`, menu);
let scriptPath = kenvPath("scripts", script) + ".js";
copy(await readFile(scriptPath, "utf8"));
setPlaceholder(`Copied content of script to clipboard`);
await wait(1000);
export {};
