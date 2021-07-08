import { getScripts } from "kit-bridge/esm/db";
let script = await arg("Change shortcut of which script?", (await getScripts(true))
    .sort((a, b) => {
    if (a?.shortcut && !b?.shortcut)
        return -1;
    if (b?.shortcut && !a?.shortcut)
        return 1;
    if (!a?.shortcut && !b?.shortcut)
        return 0;
    return a?.shortcut > b?.shortcut
        ? 1
        : a?.shortcut < b?.shortcut
            ? -1
            : 0;
})
    .map((script) => {
    return {
        name: script?.menu || script.command,
        description: `${script?.shortcut ? `${script?.shortcut} :` : ``}${script?.description || ""}`,
        value: script,
    };
}));
let { filePath } = script;
let { shortcut } = await hotkey();
let fileContents = await readFile(filePath, "utf-8");
let reg = /(?<=^\/\/\s*Shortcut:\s).*(?=$)/gim;
if (fileContents.split("\n").some(line => line.match(reg))) {
    let newContents = fileContents.replace(reg, shortcut);
    await writeFile(filePath, newContents);
}
else {
    await writeFile(filePath, `//Shortcut: ${shortcut}\n${fileContents}`);
}
let message = `${shortcut} assigned to ${script?.menu || script.command}`;
setHint(message);
await wait(2000);
await cli("change-shortcut");
