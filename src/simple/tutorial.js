export let tutorialCheck = async () => {
  if (
    process.env.TUTORIAL_CONTENT_PATH &&
    process.env.SIMPLE_TEMPLATE == "tutorial"
  ) {
    echo(
      `
  Congratulations! You're ready to explore the wonderful world of Simple Scripts. 🥳
  
  * Type ${chalk.green.bold(
    "simple"
  )} in your terminal to keep exploring features.
  * Create new scripts by typing ${chalk.green.bold(
    "new"
  )} .
  * Review the included examples by typing ${chalk.green.bold(
    "edit"
  )} 👀
    `
    )
    let { updateEnv } = await import("./utils.js")
    await updateEnv("SIMPLE_TEMPLATE", "default")
  }
}
