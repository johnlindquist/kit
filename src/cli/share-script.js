"use strict";
//Menu: Share Script as Gist
//Description: Create a gist from the selected script
Object.defineProperty(exports, "__esModule", { value: true });
let { Octokit } = await npm("scriptkit-octokit");
const utils_js_1 = require("../utils.js");
let { filePath, command } = await (0, utils_js_1.selectScript)(`Share which script?`);
let octokit = new Octokit({
    auth: {
        scopes: ["gist"],
        env: "GITHUB_TOKEN_SCRIPT_KIT_GIST",
    },
});
let response = await octokit.rest.gists.create({
    files: {
        [command + ".js"]: {
            content: await readFile(filePath, "utf8"),
        },
    },
    public: true,
});
copy(response.data.files[command + ".js"].raw_url);
console.log(`Copied raw gist url to clipboard`);
await wait(2000);
