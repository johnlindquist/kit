/**
 * Congratulations! You made a `{{name}}` script! 🎉
 * You can now run this script with `{{name}}` in your terminal
 */

console.log(`{{USER}} made a {{name}} script!`)

/**
 * First, let's accept an argument and log it out
 * 1. Uncomment the 2 lines "let user" and "console.log"
 * 2. Run `{{name}}` in your terminal again
 */

// let user = await arg("Type your github username:")
// console.log(`You typed: ${user}`)

/**
 * Second, let's fetch data from the github api
 * 1. Uncomment lines the 2 lines "let response" and "console.log"
 * 2. Run `{{name}} {{USER}}` (assuming this is your github username)
 */

// let response = await get(`https://api.github.com/users/${user}`)
// console.log(`Found the name ${response.data.name} for user ${user}`)

/**
 * Finally, let's write your data to a file
 * 1. Uncomment the lines from "let template" to "launchEditor"
 * 2. Run `{{name}} {{USER}}` again
 * Note: a prompt will ask you to select a directory for your file
 */

// let template = `# Congratulations! ${response.data.name} 🏆:
// Check your terminal for next steps 👀`
//
// let contentPath = await env("TUTORIAL_CONTENT_PATH", { type: "dir", message: "Where should we store your file?" })
// let filePath = path.join(contentPath, user + ".md")
// await writeFile(filePath, template)
// launchEditor(filePath)

/**
 * Welcome to the wonderful world of Simple Scripts!
 * Happy Scripting! 🤓 - John Lindquist @johnlindquist
 */
