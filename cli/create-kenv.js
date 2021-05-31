import { Channel } from "../enums.js";
let createKenvPathFromName = async (name) => {
    let newKenvPath = home(`.kenv-${name}`);
    if (name.startsWith(path.sep)) {
        newKenvPath = name;
    }
    return newKenvPath;
};
let newKenvName = await arg({
    placeholder: "Name of new kenv:",
    input: "shared",
    validate: async (input) => {
        let attemptPath = await createKenvPathFromName(input);
        let exists = await isDir(attemptPath);
        if (exists) {
            return `${attemptPath} already exists...`;
        }
        return true;
    },
}, async (input) => {
    let newKenvPath = await createKenvPathFromName(input);
    if (!input) {
        setHint(`Name is required`);
    }
    else if (await isDir(newKenvPath)) {
        setHint(`${newKenvPath} already exists`);
    }
    else {
        setHint(`Kenv will be created at ${newKenvPath}`);
    }
});
if (!newKenvName)
    exit();
let newKenvPath = await createKenvPathFromName(newKenvName);
await degit(`johnlindquist/kenv-template`).clone(newKenvPath);
let envTemplate = await readFile(kitPath("templates", "env", "template.env"), "utf8");
let envTemplateCompiler = compile(envTemplate);
let compiledEnvTemplate = envTemplateCompiler({
    ...env,
    KENV: newKenvPath,
});
await writeFile(path.join(newKenvPath, ".env"), compiledEnvTemplate);
global.send(Channel.CREATE_KENV, { kenvPath: newKenvPath });
