//Menu: Edit Menu
//Description: The right-click action of the app
import { selectScript } from "../utils.js";
let { command, filePath } = await selectScript(`Which script do you want to edit?`);
let editActions = [
    {
        name: "Open",
        description: `Open ${command}${env.KIT_EDITOR ? ` in ${env.KIT_EDITOR}` : ``}`,
        value: "edit",
    },
    {
        name: "Duplicate",
        description: `Make a copy of ${command} and open${env.KIT_EDITOR ? ` in ${env.KIT_EDITOR}` : ``}`,
        value: "duplicate",
    },
    {
        name: "Rename",
        description: `Prompt to rename ${command}`,
        value: "rename",
    },
    {
        name: "Remove",
        description: `Delete ${command} to trash`,
        value: "remove",
    },
    {
        name: `Open ${command}.log`,
        description: `Opens ${command}.log in your editor`,
        value: "open-command-log",
    },
];
let editAction = await arg("Which action?", editActions);
await cli(editAction, filePath);
