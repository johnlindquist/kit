// Name: MCP Full Example
// Description: Demonstrates MCP integration with Script Kit args
// mcp: example-tool
import "@johnlindquist/kit";
// Script Kit will prompt for these if not provided via MCP
const name = await arg("What's your name?");
const age = await arg("What's your age?");
const favoriteColor = await arg({
    placeholder: "What's your favorite color?",
    choices: ["red", "blue", "green", "yellow", "purple"]
});
// Process the inputs
const processedData = {
    greeting: `Hello ${name}!`,
    details: {
        name,
        age: parseInt(age),
        favoriteColor
    },
    funFact: `Did you know that ${name} who is ${age} years old loves the color ${favoriteColor}?`,
    timestamp: new Date().toISOString()
};
// Format the result for MCP using the MCPToolResult type
const result = {
    content: [{
            type: 'text',
            text: JSON.stringify(processedData, null, 2)
        }]
};
// When called via MCP, this result will be returned
// When called via Script Kit UI, the prompts will appear
export default result;
//# sourceMappingURL=mcp-example-full.js.map