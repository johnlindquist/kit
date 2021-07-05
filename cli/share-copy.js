//Menu: Copy Script to Clipboard
//Description: Copies Script to Clipboard
import { scriptValue } from "kit-bridge/esm/db";
let command = await arg(`Which script do you want to share?`, scriptValue("command"));
let scriptPath = kenvPath("scripts", command) + ".js";
copy(await readFile(scriptPath, "utf8"));
setPlaceholder(`Copied content of "${command}.js" to clipboard`);
await wait(2000);
