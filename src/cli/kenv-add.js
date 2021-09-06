"use strict";
// Description: Add Local Kenv Repo
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@core/util");
let createKenvPathFromName = async (name) => {
    let addKenvPath = "";
    if (name.startsWith(path.sep)) {
        addKenvPath = name;
    }
    if (name.startsWith("~")) {
        addKenvPath = home(name.slice(2));
    }
    return addKenvPath;
};
let existingKenvPath = await arg({
    placeholder: "Path to kenv:",
    validate: async (input) => {
        let attemptPath = await createKenvPathFromName(input);
        let exists = await isDir(path.join(attemptPath, "scripts"));
        if (!exists) {
            return `${attemptPath} doesn't look like a kenv dir...`;
        }
        return true;
    },
}, async (input) => {
    let attemptPath = await createKenvPathFromName(input);
    let exists = await isDir(path.join(attemptPath, "scripts"));
    if (!input) {
        setHint(`Type path to kenv`);
    }
    else if (!exists) {
        setHint(`⚠️ No "scripts" dir in ${input}`);
    }
    else {
        setHint(`✅ found "scripts" dir`);
    }
});
if (!existingKenvPath)
    exit();
let input = (0, util_1.getLastSlashSeparated)(existingKenvPath, 2)
    .replace(/\.git|\./g, "")
    .replace(/\//g, "-");
let panelContainer = content => `<div class="p-4">${content}</div>`;
let setPanelContainer = content => {
    setPanel(panelContainer(content));
};
let kenvName = await arg({
    placeholder: `Enter a kenv name`,
    input,
    hint: `Enter a name for ${(0, util_1.getLastSlashSeparated)(existingKenvPath, 2)}`,
    validate: async (input) => {
        let exists = await isDir(kenvPath("kenvs", input));
        if (exists) {
            return `${input} already exists`;
        }
        return true;
    },
}, async (input) => {
    let exists = await isDir(kenvPath("kenvs", input));
    if (!input) {
        setPanelContainer(`A kenv name is required`);
    }
    else if (exists) {
        setPanelContainer(`A kenv named "${input}" already exists`);
    }
    else {
        setPanelContainer(`
        <p>Will symlink to to:</p>
        <p class="font-mono">${kenvPath("kenvs", input)}</p>`);
    }
});
let kenvDir = kenvPath("kenvs", kenvName);
ln("-s", existingKenvPath, kenvDir);
await getScripts(false);
await cli("create-all-bins");
