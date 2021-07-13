import { selectScript } from "../utils.js";
let firstPass = true;
while (true) {
    let { command, filePath } = await selectScript(firstPass
        ? `Which script do you want to remove?`
        : `Remove another script?`);
    firstPass = false;
    let confirm = await arg({
        placeholder: `Remove ${command}?`,
        hint: filePath,
    }, [
        { name: "No, cancel.", value: false },
        { name: `Yes, remove ${command}`, value: true },
    ]);
    if (confirm) {
        await trash([filePath, kenvPath("bin", command)]);
        await cli("refresh-scripts-db");
    }
}
