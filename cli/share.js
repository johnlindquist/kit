//Menu: Share Script
//Description: Share the selected script
let { menu } = await cli("fns");
let { command } = await arg(`Which script do you want to share?`, menu);
let how = await arg("How would you like to share?", [
    {
        name: "Copy script to clipboard",
        value: "share-copy",
    },
    {
        name: "Post as a gist",
        value: "share-script",
    },
    {
        name: "Create install link",
        value: "share-script-as-link",
    },
]);
await cli(how, command);
export {};
