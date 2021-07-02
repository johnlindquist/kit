import { selectScript, stripMetadata } from "../utils.js";
let { filePath } = await selectScript(`Which script do you want to duplicate?`);
let newCommand = await arg({
    placeholder: `Enter the new script name:`,
});
if (!(await isFile(filePath))) {
    console.warn(`${filePath} doesn't exist...`);
    exit();
}
let newFilePath = kenvPath("scripts", newCommand.replace(/(?<!\.js)$/, ".js"));
let oldContent = await readFile(filePath, "utf-8");
let newContent = stripMetadata(oldContent);
await writeFile(newFilePath, newContent);
await cli("create-bin", "scripts", newCommand);
edit(newFilePath, kenvPath());
