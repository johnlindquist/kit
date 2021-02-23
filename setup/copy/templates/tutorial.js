/**
 * Congratulations! You made a `{{name}}` script! 🎉
 *
 * 1. Follow the instructions in the comments below.
 * 2. Run `{{name}}` in the terminal after each step:
 */

console.log(`{{USER}} made a {{name}} script!`)

/**
 * Step 1: Accept an argument and log it out
 * 1. Uncomment the 2 lines "let user" and "console.log"
 * 2. Run `{{name}}` in your terminal again
 */

// let user = await arg("Type your github username:")
// console.log(`You typed: ${user}`)

/**
 * Step 2: Fetch data from the github api
 * 1. Uncomment lines the 2 lines "let response" and "console.log"
 * 2. Run `{{name}} {{USER}}` (assuming this is your github username)
 */

// let response = await get(`https://api.github.com/users/${user}`)
// console.log(`Found the name ${response.data.name} for user ${user}`)

/**
 * Step 3: Write your data to a template
 * 1. Uncomment the lines from "contentPath" to "edit"
 * 2. Run `{{name}} {{USER}}` again
 * Note: a prompt will ask you to select a directory for your file
 */

// let contentPath = await env("TUTORIAL_CONTENT_PATH", {
//   message: "Where should we store your file?",
// })
// let content = await compileTemplate("tutorial.md", {
//   name: response.data.name,
// })
// let filePath = path.join(contentPath, `${user}.md`)
// await writeFile(filePath, content)
// await edit(filePath)
