/**
 * Description: Creates a new empty script you can invoke from the terminal
 *
 * Usage:
 * new my-first-script
 */

export let name = await arg(
  `Welcome! Let's create our first script together. 
  Please name your script:`,
  {
    type: "suggest",
    name: "name",
    suggestions: [
      "my-first-script",
      "party-time",
      "demo-time",
      "woo-hoo",
    ],
  }
)

await createScript(name)

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
