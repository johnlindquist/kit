"use strict";
// Description: Creates a script from an entered url
Object.defineProperty(exports, "__esModule", { value: true });
const utils_js_1 = require("../utils.js");
let url = await arg("Enter script url:");
let contents = (await get(url)).data;
if (url.endsWith(".js")) {
    let nameFromUrl = url.split("/").pop().replace(".js", "");
    updateArgs([nameFromUrl]);
}
let name = await arg({
    placeholder: "Enter a name for your script:",
    validate: utils_js_1.exists,
});
let scriptPath = path.join(kenvPath("scripts"), name + ".js");
await writeFile(scriptPath, contents);
await cli("create-bin", "scripts", name);
edit(scriptPath, kenvPath());
