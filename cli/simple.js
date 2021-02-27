//Description: Simple Scripts CLI

const cliScripts = [
  {
    name: "open",
    message: "Open .simple directory in editor",
  },
  { name: "browse", message: "Go to simplescripts.dev" },
  { name: "new", message: "Create a new script" },
  {
    name: "new-from-template",
    message: "Create a new script from a template",
  },
  { name: "run", message: "Run a script" },
  { name: "edit", message: "Edit a script" },
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
  { name: "clear", message: "Clear the caches" },
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
  { name: "sdk", message: "Open the sdk" },
  { name: "env", message: "Modify .env" },
  { name: "issue", message: "File an issue on github" },
  { name: "open-at-login", message: "Open at login" },
  { name: "open-log", message: "Open simple.log" },
  {
    name: "update",
    message: `Update simple. App: ${env.SIMPLE_APP_VERSION}`,
  },
  { name: "quit", message: "Quit Simple Scripts" },
]

let script = await arg(
  "What do you want to do?",
  () =>
    cliScripts.map(({ name, message, alias }) => {
      return {
        name: chalk`{green.bold ${name}}${
          alias ? chalk` {yellow (${alias})}` : ""
        }: ${message}`,
        value: name,
      }
    }),
  true
)

let found = cliScripts.find(
  config => config.name == script || config.alias == script
)
if (found) {
  script = "cli/" + found.name
}

let values = await sdk(script)
