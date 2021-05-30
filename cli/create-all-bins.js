let { scripts } = await import("../utils.js");
await trash([
    `!${kenvPath("bin", ".gitignore")}`,
    kenvPath("bin", "*"),
]);
let scriptNames = await scripts();
for await (let script of scriptNames) {
    await cli("create-bin", "scripts", script.replace(".js", ""));
}
export {};
