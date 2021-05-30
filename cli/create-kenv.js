let kenv = await arg({
    placeholder: "Enter full path to new kenv dir:",
    hint: md(`e.g., \`/Users/johnlindquist/projects/privatekenv\``),
});
await degit(`johnlindquist/kenv-template`).clone(path.join(kenv));
global.send("CREATE_KENV", { kenvPath: kenv });
export {};
