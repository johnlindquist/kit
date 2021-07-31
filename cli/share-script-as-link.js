//Menu: Share Script as scriptkit.com link
//Description: Create a gist and share from ScriptKit
let { Octokit } = await npm("scriptkit-octokit");
import { selectScript } from "../utils.js";
let { filePath, command } = await selectScript(`Share which script?`);
let octokit = new Octokit({
    auth: {
        scopes: ["gist"],
        env: "GITHUB_TOKEN_SCRIPT_KIT_GIST",
    },
});
let scriptJS = `${command}.js`;
let response = await octokit.rest.gists.create({
    files: {
        [command + ".js"]: {
            content: await readFile(filePath, "utf8"),
        },
    },
    public: true,
});
let link = `https://scriptkit.com/api/new?name=${command}&url=${response.data.files[scriptJS].raw_url}`;
copy(link);
console.log(`Copied share link to clipboard`);
await wait(2000);
