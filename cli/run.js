// Description: Run the selected script
let { scriptValue } = (await cli("fns"));
let command = await arg(`Which script do you want to run?`, scriptValue("command"));
await run(command);
export {};
