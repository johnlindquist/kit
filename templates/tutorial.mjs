#!/usr/bin/env js
//👋 The "shebang" line above is required for scripts to run

/*
 * Congratulations! 🎉 You made a `{{name}}` script! 🎈
 * You can now run this script with `${name}` in your terminal
 */

console.log(`{{USER}} made a {{name}} script!`)

/*
 * First, let's accept an argument and log it out:
 */

// let user = await arg(0)

// console.log(user)

/*
 * Second, let's query the github api with our argument
 * Uncomment the following lines and run `{{name}} {{USER}}` (assuming this is your github username)
 */

// let response = await get(`https://api.github.com/users/${user})

// console.log(response.data)

/*
 * Finally, let's write the data to a file
 * Uncomment the following lines and re-run the command
 */

// await writeFile(user + ".json", JSON.stringify(response.data))

/*
 * Congratulations! You're ready to explore the wonderful world of JavaScript Scripts.
 * You've probably noticed the helper functions (arg, get, and writeFile).
 * Run `js globals` to explore all the helpers available.
 */

/*
 * Disable these comments in the future by running "js env" then switching to the default template in .env:
 * TEMPLATE=default
 *
 * Happy Scripting! 🤓 - John Lindquist @johnlindquist
 */
