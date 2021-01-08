// Description: Run the selected script

let file = await arg(`Which script do you want to run?`, {
  type: "search-list",
  name: "file",
  loop: false,
  choices: (await run("cli/scripts-info"))[0],
})

let fileName = file + ".js"
run(path.join(env.SIMPLE_SCRIPTS_PATH, fileName))
