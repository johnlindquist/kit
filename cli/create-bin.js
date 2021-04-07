let type = await arg("Select type:", ["scripts", "cli"]);
let name = await arg("Script name:");
let binTemplate = await readFile(kitPath("templates", "bin", "template"), "utf8");
let binTemplateCompiler = compile(binTemplate);
let compiledBinTemplate = binTemplateCompiler({
    name,
    type,
    ...env,
    TARGET_PATH: kenvPath(),
});
let binFilePath = kenvPath("bin", name);
mkdir("-p", path.dirname(binFilePath));
await writeFile(binFilePath, compiledBinTemplate);
chmod(755, binFilePath);
export {};
