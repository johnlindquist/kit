// Description: Remove a script
import { selectScript } from "../utils.js";
let command, filePath;
while (true) {
    let hint = command
        ? `Removed ${command}. Remove another?`
        : ``;
    ({ command, filePath } = await selectScript({
        placeholder: `Remove a script:`,
        hint,
    }));
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
