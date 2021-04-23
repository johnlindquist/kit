let { host, port } = await new Promise((res, rej) => {
    let messageHandler = (data) => {
        if (data.channel === "SERVER") {
            res(data);
            process.off("message", messageHandler);
        }
    };
    process.on("message", messageHandler);
    send("GET_SERVER_STATE");
});
let otherOptions = [
    {
        name: "Get Help",
        description: `Post a question to Script Kit GitHub discussions`,
        value: "get-help",
    },
    {
        name: "Check for Update",
        description: `Version: ${env.KIT_APP_VERSION}`,
        value: "update",
    },
    {
        name: "Manage npm packages",
        description: `add or remove npm package`,
        value: "manage-npm",
    },
    {
        name: "Clipboard history",
        description: "Paste from clipboard history",
        value: "clipboard",
    },
    {
        name: host && port ? "Stop Server" : "Start Server",
        description: host && port
            ? `Server running on http://${host}:${port}`
            : "",
        value: "toggle-server",
    },
    {
        name: "Open Script Kit at Login",
        description: "Sets Script Kit to launch at login",
        value: "open-at-login",
    },
    {
        name: "Add ~/.kenv/bin to $PATH",
        description: `Looks for your profile and appends to $PATH`,
        value: "add-kenv-to-profile",
    },
    {
        name: "Generate bin files",
        description: "Recreate all the terminal executables",
        value: "create-all-bins",
    },
    {
        name: "Change main keyboard shortcut",
        description: "Pick a new keyboard shortcut for the main menu",
        value: "change-main-shortcut",
    },
    {
        name: "Prepare Script for Stream Deck",
        description: "Launch a script from a Stream Deck button",
        value: "stream-deck",
    },
    {
        name: "Quit",
        description: `Quit Script Kit`,
        value: "quit",
    },
];
let cliScript = await arg(`Other options:`, otherOptions);
await cli(cliScript);
export {};
