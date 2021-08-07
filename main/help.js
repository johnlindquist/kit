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
        name: "Subscribe to Newsletter",
        description: `Receive a newsletter with examples and tips`,
        value: "join",
    },
];
let cliScript = await arg(`Got questions?`, kitManagementChoices);
await cli(cliScript);
export {};
