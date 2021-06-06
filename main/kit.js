let kitManagementChoices = [
    {
        name: "Get Help",
        description: `Post a question to Script Kit GitHub discussions`,
        value: "get-help",
    },
    {
        name: "Visit docs",
        description: `Work in progress...`,
        value: "goto-docs",
    },
    {
        name: "Check for Update",
        description: `Version: ${env.KIT_APP_VERSION}`,
        value: "update",
    },
    {
        name: "View schedule",
        description: "View and edit upcoming jobs",
        value: "schedule",
    },
    {
        name: "System Scripts",
        description: "View and edit system event scripts",
        value: "system-events",
    },
    {
        name: "Open Script Kit at Login",
        description: "Sets Script Kit to launch at login",
        value: "open-at-login",
    },
    {
        name: "Add ~/.kit/bin to $PATH",
        description: `Looks for your profile and appends to $PATH`,
        value: "add-kit-to-profile",
    },
    {
        name: "Change main keyboard shortcut",
        description: "Pick a new keyboard shortcut for the main menu",
        value: "change-main-shortcut",
    },
    {
        name: "Clear Kit prompt cache",
        description: "Reset prompt position and sizes",
        value: "kit-clear-prompt",
    },
    {
        name: "Created by John Lindquist",
        description: `Follow @johnlindquist on twitter`,
        value: "credits",
        img: kitPath("images", "john.png"),
    },
    {
        name: "Quit",
        description: `Quit Script Kit`,
        value: "quit",
    },
];
let cliScript = await arg(`Kit Options`, kitManagementChoices);
console.log({ cliScript });
await cli(cliScript);
export {};
