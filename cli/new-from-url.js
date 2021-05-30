// Description: Creates a script from an entered url
let { exists } = await import("../utils.js");
let url = await arg("Enter script url:");
let contents = (await get(url)).data;
if (url.endsWith(".js")) {
    let nameFromUrl = url.split("/").pop().replace(".js", "");
    updateArgs([nameFromUrl]);
}
let name = await arg({
    placeholder: "Enter a name for your script:",
    validate: exists,
});
let scriptPath = path.join(kenvPath("scripts"), name + ".js");
await writeFile(scriptPath, contents);
await cli("create-bin", "scripts", name);
edit(scriptPath, kenvPath());
export {};
