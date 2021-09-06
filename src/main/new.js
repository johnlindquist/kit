"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let newOptions = [
    {
        name: "New from name",
        description: "Enter a script name",
        value: "new",
    },
    {
        name: "New from url",
        description: "Enter a url then name it",
        value: "new-from-url",
    },
    {
        name: "Browse Community Examples",
        description: "Visit scriptkit.com/scripts/ for a variety of examples",
        value: "browse-examples",
    },
];
let cliScript = await arg({
    placeholder: "Create a new script",
    strict: false,
}, newOptions);
if (newOptions.find(script => script.value === cliScript)) {
    await run(kitPath(`cli`, cliScript + ".js"));
}
else {
    await cli("new", cliScript);
}
