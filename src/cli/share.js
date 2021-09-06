"use strict";
//Menu: Share Script
//Description: Share the selected script
Object.defineProperty(exports, "__esModule", { value: true });
const utils_js_1 = require("../utils.js");
let { filePath, command } = await (0, utils_js_1.selectScript)(`Share which script?`);
let how = await arg("How would you like to share?", [
    {
        name: "Copy script to clipboard",
        value: "share-copy",
    },
    {
        name: "Post as a gist",
        value: "share-script",
    },
    {
        name: "Create install link",
        value: "share-script-as-link",
    },
    {
        name: "Prep for discussion",
        value: "share-script-as-discussion",
    },
]);
await cli(how, filePath);
