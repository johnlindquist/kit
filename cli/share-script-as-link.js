//Menu: Share Script as scriptkit.com link
//Description: Create a gist and share from ScriptKit
let { menu } = await cli("fns");
let script = await arg({
    placeholder: `Which script do you want to share?`,
}, menu);
let token = await env("GITHUB_GIST_TOKEN", {
    secret: true,
    ignoreBlur: true,
    hint: md(`Click to create a [github gist token](https://github.com/settings/tokens/new?scopes=gist&description=kit+share+script+token)`),
    placeholder: chalk `Enter GitHub gist token:`,
});
let scriptJS = `${script}.js`;
let scriptPath = kenvPath("scripts", scriptJS);
let isPublic = await arg("Make gist public?", [
    { name: `No, keep ${script} private`, value: false },
    { name: `Yes, make ${script} public`, value: true },
]);
let body = {
    files: {
        [scriptJS]: {
            content: await readFile(scriptPath, "utf8"),
        },
    },
};
if (isPublic)
    body.public = true;
let config = {
    headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${token}`,
    },
};
const response = await post(`https://api.github.com/gists`, body, config);
let link = `https://scriptkit.com/api/new?name=${script}&url=${response.data.files[scriptJS].raw_url}`;
exec(`open ` + response.data.html_url);
copy(link);
setPlaceholder(`Copied share link to clipboard`);
await wait(1000);
export {};
