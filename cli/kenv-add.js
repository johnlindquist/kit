import { Channel } from "../enums.js";
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
    if (exists) {
        setHint(`${attemptPath} looks like a kenv dir ✅ `);
    }
    if (!exists) {
        setHint(`${attemptPath} is not a kenv dir ❌`);
    }
});
if (!existingKenvPath)
    exit();
let addKenvPath = await createKenvPathFromName(existingKenvPath);
global.send(Channel.CREATE_KENV, { kenvPath: addKenvPath });
