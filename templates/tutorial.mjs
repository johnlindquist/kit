#!/usr/bin/env js
/**
 * Congratulations! 🎉 You made a `{{name}}` script! 🎈
 * You can now run this script with `{{name}}` in your terminal
 */

console.log(`{{USER}} made a {{name}} script!`)

/**
 * First, let's accept an argument and log it out
 * 1. Uncomment the following two lines
 * 2. Run `{{name}}` in your terminal again
 * Note: We use "lazy args". You will be prompted if you don't provide an arg.
 */

// let user = await arg("Type a github username:")
// console.log(user)

/**
 * Second, let's query the github api with our argument
 * 1. Uncomment the following lines
 * 2. Run `{{name}} {{USER}}` (assuming this is your github username)
 */

// let response = await get(`https://api.github.com/users/${user}`)
// console.log(response.data)

/**
 * Finally, let's write the data to a file
 * 1. Uncomment the following lines
 * 2. Run `{{name}} {{USER}}` again
 * Note: We also support "lazy env"
 * You will be prompted to set a "CONTENT_PATH" environment variable if one is not already set in .env
 */

// let template = `${response.data.name} is awesome!`
// let contentPath = await env("CONTENT_PATH")
// let filePath = path.join(contentPath, user + ".txt")
// await writeFile(filePath, template)
// editor(filePath)

/**
 * Congratulations! You're ready to explore the wonderful world of JavaScript Scripts. 🥳
 * Type "js" in your terminal to play around with more options.
 * Use "new" to create new scripts from anywhere.
 * Review the included examples by typing "edit" 👀
 */

/**
 * This file was created with the "tutorial" template. Switch to the "default" template without comments by running
 * "js env" adjusting the following line in your .env:
 * TEMPLATE=default
 *
 * Happy Scripting! 🤓 - John Lindquist @johnlindquist
 */
