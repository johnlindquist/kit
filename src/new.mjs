#!/usr/bin/env js
/**
 * Description: Creates a new empty script you can invoke from the terminal
 *
 * Usage:
 * new my-first-script
 */

let tutorial = (await env["TEMPLATE"]) == "tutorial"

let name
if (tutorial) {
  name = await arg(
    "Welcome! Enter a name for your first script:",
    {
      type: "suggest",
      name: "name",
      suggestions: [
        "hello-world",
        "my-first-script",
        "party-time",
        "demo-time",
        "woo-hoo",
      ],
    }
  )
} else {
  name = await arg("Enter a name for your script:")
}

createScript(name)

if (tutorial) {
  echo(
    chalk.yellow.italic(`You can run your new script (`) +
      chalk.green.bold(name) +
      chalk.yellow.italic(`) from anywhere!`),
    "🤯"
  )

  echo(
    chalk.white(
      "Play with the script. Make any changes you want. Then type: "
    ) + chalk.green.bold(name)
  )
}
