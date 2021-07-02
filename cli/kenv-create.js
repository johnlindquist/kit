let newKenvName = await arg({
    placeholder: "Name of new kenv:",
    validate: async (input) => {
        let attemptPath = kenvPath("kenvs", input);
        let exists = await isDir(attemptPath);
        if (exists) {
            return `${attemptPath} already exists...`;
        }
        return true;
    },
}, async (input) => {
    let newKenvPath = kenvPath("kenvs", input);
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
let newKenvPath = kenvPath("kenvs", newKenvName);
await degit(`johnlindquist/kenv-template`).clone(newKenvPath);
export {};
