export let file = await arg("Get info for:");
!file.endsWith(".js") && (file = `${file}.js`); //Append .js if you only give script name
let getByMarker = (marker) => (lines) => lines
    ?.find(line => line.includes(marker))
    ?.split(marker)[1]
    ?.trim();
export let filePath = file.startsWith("/scripts")
    ? kenvPath(file)
    : file.startsWith(path.sep)
        ? file
        : kenvPath(!file.includes("/") && "scripts", file);
let fileContents = await readFile(filePath, "utf8");
let fileLines = fileContents.split("\n");
export let description = getByMarker("Description:")(fileLines);
export let menu = getByMarker("Menu:")(fileLines);
export let shortcut = getByMarker("Shortcut:")(fileLines);
export let alias = getByMarker("Alias:")(fileLines);
export let author = getByMarker("Author:")(fileLines);
export let twitter = getByMarker("Twitter:")(fileLines);
export let shortcode = getByMarker("Shortcode:")(fileLines);
export let exclude = getByMarker("Exclude:")(fileLines);
export let cron = getByMarker("Cron:")(fileLines);
export let system = getByMarker("System:")(fileLines);
export let command = file.replace(".js", "");
