//Description: Script Kit CLI

const cliScripts = [
  {
    name: "open",
    message: "Open .kenv directory in editor",
  },
  {
    name: "open-kit",
    message: "Open .kit directory in editor",
  },
  { name: "browse", message: "Go to scriptkit.app" },
  { name: "new", message: "Create a new script" },
  {
    name: "new-from-template",
    message: "Create a new script from a template",
  },
  {
    name: "new-from-url",
    message: "Create a script from a url",
  },
  {
    name: "share-script",
    message: "Share a script as a Gist",
  },
  {
    name: "share-script-as-link",
    message: "Share a script as a ScriptKit.app link",
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
    name: "update",
    message: `Version: ${env.KIT_APP_VERSION}`,
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
  {
    name: "add-kenv-to-profile",
    message: "Add .kenv/bin to your path",
  },
  { name: "env", message: "Modify .env" },
  { name: "issue", message: "File an issue on github" },
  { name: "open-at-login", message: "Open at login" },
  { name: "open-log", message: "Open kit.log" },
  {
    name: "toggle-server",
    message: "Start/stop the server",
  },
  { name: "quit", message: "Quit Kit" },
]

let script = await arg(
  "What do you want to do?",
  () =>
    cliScripts.map(
      ({ name, message, alias, description }) => {
        if (env.KIT_CONTEXT === "app") {
          return {
            name: chalk`{green.bold ${name}}${
              alias ? chalk` {yellow (${alias})}` : ""
            }`,
            description: message,
            value: name,
          }
        }

        return {
          name: chalk`{green.bold ${name}}${
            alias ? chalk` {yellow (${alias})}` : ""
          }: ${message}`,
          value: name,
        }
      }
    ),
  true
)

let found = cliScripts.find(
  config => config.name == script || config.alias == script
)
if (found) {
  await cli(found.name)
}
