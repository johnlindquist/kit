let otherOptions = [
    {
        name: "Switch Kenv",
        description: "Switch to a different Kit environment",
        value: "kenv-switch",
    },
    {
        name: `Open Kenv in Editor`,
        description: `Open ${kitPath()}`,
        value: "open-kenv",
    },
    {
        name: "Create Kenv",
        description: "Create a new Kit environment",
        value: "kenv-create",
    },
    {
        name: "Add Kenv",
        description: "Add an existing kenv",
        value: "kenv-add",
    },
    {
        name: "Manage npm packages",
        description: `add or remove npm package`,
        value: "manage-npm",
    },
    {
        name: "Add Kenv bin to $PATH",
        description: `Looks for your profile and appends ${kenvPath()} to $PATH`,
        value: "add-kenv-to-profile",
    },
    {
        name: "Generate bin files",
        description: "Recreate all the terminal executables",
        value: "create-all-bins",
    },
    {
        name: "Change script shortcut",
        description: "Pick a new keyboard shortcut for a script",
        value: "change-shortcut",
    },
    {
        name: "Change editor",
        description: "Pick a new editor",
        value: "change-editor",
    },
    {
        name: "Prepare Script for Stream Deck",
        description: "Launch a script from a Stream Deck button",
        value: "stream-deck",
    },
];
let cliScript = await arg(`Manage Kit environment`, otherOptions);
await cli(cliScript);
export {};
