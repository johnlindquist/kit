//Description: Script Kit CLI
const cliScripts = [
    { name: "run", placeholder: "Run a script" },
    { name: "edit", placeholder: "Edit a script" },
    { name: "new", placeholder: "Create a new script" },
    {
        name: "open",
        placeholder: "Open .kenv directory in editor",
    },
    { name: "browse", placeholder: "Go to scriptkit.com" },
    {
        name: "new-from-template",
        placeholder: "Create a new script from a template",
    },
    {
        name: "new-from-url",
        placeholder: "Create a script from a url",
    },
    {
        name: "share-script",
        placeholder: "Share a script as a Gist",
    },
    {
        name: "share-script-as-link",
        placeholder: "Share a script as a scriptkit.com link",
    },
    {
        name: "duplicate",
        alias: "cp",
        placeholder: "Duplicate a script",
    },
    {
        name: "rename",
        alias: "mv",
        placeholder: "Rename a script",
    },
    {
        name: "remove",
        alias: "rm",
        placeholder: "Remove a script",
    },
    { name: "clear", placeholder: "Clear the caches" },
    {
        name: "update",
        placeholder: `Version: ${env.KIT_APP_VERSION}`,
    },
    {
        name: "install",
        alias: "i",
        placeholder: "Install an npm package",
    },
    {
        name: "uninstall",
        alias: "un",
        placeholder: "Uninstall an npm package",
    },
    {
        name: "add-kenv-to-profile",
        placeholder: "Add .kenv/bin to your path",
    },
    {
        name: "add-kit-to-profile",
        placeholder: "Add .kit/bin to your path",
    },
    { name: "env", placeholder: "Edit .env" },
    {
        name: "set-env-var",
        placeholder: "Add env var to .env",
    },
    { name: "issue", placeholder: "File an issue on github" },
    { name: "open-at-login", placeholder: "Open at login" },
    {
        name: "create-all-bins",
        placeholder: "Regen bin files",
    },
    {
        name: "open-kit",
        placeholder: "Open .kit directory in editor",
    },
    { name: "open-log", placeholder: "Open kit.log" },
    { name: "quit", placeholder: "Quit Kit" },
];
let script = await arg("What do you want to do?", () => cliScripts.map(({ name, placeholder, alias }) => {
    return {
        name: chalk `{green.bold ${name}}${alias ? chalk ` {yellow (${alias})}` : ""}: ${placeholder}`,
        value: name,
    };
}));
let found = cliScripts.find(config => config.name == script || config.alias == script);
if (found) {
    await cli(found.name);
}
export {};
