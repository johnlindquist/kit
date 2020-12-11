let name = new URL(import.meta.url).searchParams.get("name")

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
