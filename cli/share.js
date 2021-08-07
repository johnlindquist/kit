//Menu: Share Script
//Description: Share the selected script
import { selectScript } from "../utils.js";
let { filePath, command } = await selectScript(`Share which script?`);
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
    {
        name: "Prep for discussion",
        value: "share-script-as-discussion",
    },
]);
await cli(how, filePath);
