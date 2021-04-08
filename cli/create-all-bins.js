await import("../setup/create-cli-bins.js");
let { scripts } = await cli("fns");
let scriptNames = await scripts();
for await (let script of scriptNames) {
    await cli("create-bin", "scripts", script.replace(".js", ""));
}
export {};
