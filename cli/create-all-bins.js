import { Bin } from "kit-bridge/esm/enum";
import { getScripts } from "kit-bridge/esm/db";
import { createBinFromScript } from "../utils.js";
await trash([
    `!${kenvPath("bin", ".gitignore")}`,
    kenvPath("bin", "*"),
]);
let scripts = await getScripts(false);
for await (let script of scripts) {
    await createBinFromScript(Bin.scripts, script);
}
