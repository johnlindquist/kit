let { scripts } = await import("../utils.js");
let input = await arg("Enter Script name:");
let valid = (await scripts()).find(script => script.replace(".js", "") === input.replace(".js", ""));
export let found = valid
    ? true
    : chalk `Script {green.bold ${input}} not found. Please select a different script:`;
