// Description: Run the selected script
let { scriptValue } = await import("../utils.js");
let command = await arg(`Which script do you want to run?`, scriptValue("command"));
await run(command);
export {};
