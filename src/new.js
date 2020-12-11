/**
 * Description: Creates a new empty script you can invoke from the terminal
 *
 * Usage:
 * new my-first-script
 */

let name = await arg("Enter a name for your script:")
let template = await env("SIMPLE_TEMPLATE")
await createScript(name, template)

let greenName = chalk.green(name)
let yellowTemplate = chalk.yellow(template)
let filePath = path.join(env.SIMPLE_SRC_PATH, name + ".js")
let editor = await env("SIMPLE_EDITOR")

echo(
  `
Created a ${greenName} script using the ${yellowTemplate} template.
Opening ${filePath} with ${editor}
  `.trim()
)
