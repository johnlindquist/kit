// Description: Creates a new empty script you can invoke from the terminal
import { exists } from "../utils.js";
let name = await arg({
    placeholder: "Enter a name for your script:",
    validate: exists,
});
let scriptPath = path.join(kenvPath("scripts"), name + ".js");
let contents = [arg?.npm]
    .flatMap(x => x)
    .filter(Boolean)
    .map(npm => `let {} = await npm("${npm}")`)
    .join("\n");
let templates = await readdir(kenvPath("templates"));
let template = await arg("Select a template", templates
    .filter(t => t.endsWith(".js"))
    .map(t => t.replace(".js", "")));
let templateContent = await readFile(kenvPath("templates", template + ".js"), "utf8");
let templateCompiler = compile(templateContent);
contents += templateCompiler({ name, ...env });
if (arg?.url) {
    contents = (await get(arg?.url)).data;
}
await writeFile(scriptPath, contents);
await cli("create-bin", "scripts", name);
console.log(chalk `\nCreated a {green ${name}} script using the {yellow ${template}} template`);
edit(scriptPath, kenvPath());
