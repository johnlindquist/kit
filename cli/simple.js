//Description: Simple Scripts CLI

const cliScripts = [
  { name: "new", message: "Create a new script" },
  { name: "run", message: "Run a script" },
  { name: "edit", message: "Edit a script" },
  {
    name: "list",
    alias: "ls",
    message: "List all scripts",
  },
  {
    name: "duplicate",
    alias: "cp",
    message: "Duplicate a script",
  },
  {
    name: "rename",
    alias: "mv",
    message: "Rename a script",
  },
  {
    name: "remove",
    alias: "rm",
    message: "Remove a script",
  },
  {
    name: "install",
    alias: "i",
    message: "Install an npm package",
  },
  {
    name: "uninstall",
    alias: "un",
    message: "Uninstall an npm package",
  },
  { name: "env", message: "Modify .env" },
  { name: "issue", message: "File an issue on github" },
  { name: "debug", message: "Launch Debugger" },
  { name: "update", message: "Update simple" },
  { name: "quit", message: "Quit Simple Scripts" },
]

let script = await arg("What do you want to do?", {
  message: "What do you want to do?",
  choices: cliScripts.map(({ name, message, alias }) => {
    return {
      name: chalk`{green.bold ${name}}${
        alias ? chalk` {yellow (${alias})}` : ""
      }: ${message}`,
      value: name,
    }
  }),
})

let found = cliScripts.find(
  config => config.name == script || config.alias == script
)
if (found) {
  script = "cli/" + found.name
}

let values = await run(script)
