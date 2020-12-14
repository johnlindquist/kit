/**
 * Description: Opens the selected script in your editor
 */

const file = await arg(
  `Which script do you want to edit?`,
  {
    type: "search-list",
    name: "file",
    loop: false,
    choices: await (
      await import("./simple/getScriptsInfo.js")
    ).getScriptsInfo(),
  }
)

const fileName = file + ".js"
launchEditor(
  path.join(process.env.SIMPLE_SRC_PATH, fileName)
)
