"use strict";
// Description: Duplicate the selected script
Object.defineProperty(exports, "__esModule", { value: true });
const utils_js_1 = require("../utils.js");
let generate = await npm("project-name-generator");
let examples = Array.from({ length: 3 })
    .map((_, i) => generate({ words: 2 }).dashed)
    .join(", ");
const util_1 = require("@core/util");
const utils_js_2 = require("../utils.js");
let { filePath } = await (0, utils_js_2.selectScript)(`Which script do you want to duplicate?`);
let newCommand = await arg({
    placeholder: `Enter name for new script`,
    selected: filePath,
    hint: `examples: ${examples}`,
    validate: utils_js_1.exists,
});
if (!(await isFile(filePath))) {
    console.warn(`${filePath} doesn't exist...`);
    exit();
}
let kenvDirs = (await readdir(kenvPath("kenvs"))) || [];
let selectedKenvDir = kenvPath();
selectedKenvDir = await arg(`Select target kenv`, [
    {
        name: "home",
        description: `Your main kenv: ${kenvPath()}`,
        value: kenvPath(),
    },
    ...kenvDirs.map(kenvDir => {
        let value = kenvPath("kenvs", kenvDir);
        return {
            name: kenvDir,
            description: value,
            value,
        };
    }),
]);
let newFilePath = path.join(selectedKenvDir, "scripts", newCommand + (newCommand.endsWith(".js") ? "" : ".js"));
let oldContent = await readFile(filePath, "utf-8");
let newContent = (0, util_1.stripMetadata)(oldContent);
await writeFile(newFilePath, newContent);
await cli("create-bin", "scripts", newFilePath);
edit(newFilePath, kenvPath());
