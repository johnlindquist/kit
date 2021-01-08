// Description: Opens the selected script in your editor

let file = await arg(`Which script do you want to edit?`, {
  type: "search-list",
  name: "file",
  loop: false,
  choices: (await run("cli/scripts-info"))[0],
})

let fileName = file + ".js"
edit(path.join(env.SIMPLE_SCRIPTS_PATH, fileName))
