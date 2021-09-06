"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Description: Create a new script
const util_1 = require("@core/util");
const utils_js_1 = require("../utils.js");
let generate = await npm("project-name-generator");
let examples = Array.from({ length: 3 })
    .map((_, i) => generate({ words: 2 }).dashed)
    .join(", ");
let name = await arg({
    placeholder: arg?.placeholder || "Enter a name for your script:",
    validate: utils_js_1.exists,
    hint: `examples: ${examples}`,
});
let kenvDirs = await (0, util_1.getKenvs)();
let selectedKenvDir = kenvPath();
if (kenvDirs.length) {
    selectedKenvDir = await arg(`Select target kenv`, [
        {
            name: "home",
            description: `Your main kenv: ${kenvPath()}`,
            value: kenvPath(),
        },
        ...kenvDirs.map(kenvDir => {
            return {
                name: path.basename(kenvDir),
                description: kenvDir,
                value: kenvDir,
            };
        }),
    ]);
}
let scriptPath = path.join(selectedKenvDir, "scripts", name + ".js");
let contents = [arg?.npm]
    .flatMap(x => x)
    .filter(Boolean)
    .map(npm => `let {} = await npm("${npm}")`)
    .join("\n");
let template = arg?.template || (await env("KIT_TEMPLATE"));
let templateContent = await readFile(kenvPath("templates", template + ".js"), "utf8");
let templateCompiler = compile(templateContent);
contents += templateCompiler({ name, ...env });
if (arg?.url) {
    contents = (await get(arg?.url)).data;
}
mkdir("-p", path.dirname(scriptPath));
await writeFile(scriptPath, contents);
await cli("create-bin", "scripts", name);
console.log(chalk `\nCreated a {green ${name}} script using the {yellow ${template}} template`);
edit(scriptPath, kenvPath());
