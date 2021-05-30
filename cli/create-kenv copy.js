let kenv = await degit(`johnlindquist/kenv-template`).clone(path.join(await arg({
    placeholder: "Enter full path to new kenv dir:",
    hint: md(`e.g., \`/Users/johnlindquist/projects/privatekenv\``),
})));
global.send("CREATE_KENV", { kenvPath: kenv });
export {};
