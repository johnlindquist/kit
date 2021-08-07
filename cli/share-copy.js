//Menu: Copy Script to Clipboard
//Description: Copies Script to Clipboard
import { selectScript } from "../utils.js";
let { filePath, command } = await selectScript(`Share which script?`);
copy(await readFile(filePath, "utf8"));
console.log(`Copied content of "${command}.js" to clipboard`);
await wait(2000);
