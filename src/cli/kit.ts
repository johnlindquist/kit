//Description: Script Kit CLI

import { CLI } from "../cli"
import {
  kitMode,
  resolveToScriptPath,
  run,
  jsh,
} from "../core/utils.js"

import { getScripts } from "../core/db.js"

let scripts = await getScripts()

let hasScripts = scripts?.length > 0

interface CLIMenuItem {
  name?: string
  placeholder?: string
  alias?: string
}

let requiresScripts = [
  { name: "run", placeholder: "Run a script" },
  { name: "edit", placeholder: "Edit a script" },
]

let notJsh = [
  {
    name: "add-kenv-to-profile",
    placeholder: "Add .kenv/bin to your path",
  },
  {
    name: "add-kit-to-profile",
    placeholder: "Add .kit/bin to your path",
  },
  { name: "env", placeholder: "Edit .env" },
  { name: "issue", placeholder: "File an issue on github" },
  { name: "open-at-login", placeholder: "Open at login" },
  {
    name: "create-all-bins",
    placeholder: "Regen bin files",
  },
  {
    name: "open-kit",
    placeholder: "Open .kit directory in editor",
  },
  { name: "kenv-create", placeholder: "Create a kenv" },
  { name: "kenv-clone", placeholder: "Clone a kenv" },
  { name: "kenv-view", placeholder: "View kenv scripts" },
  { name: "kenv-push", placeholder: "Push a kenv" },
  { name: "kenv-pull", placeholder: "Pull a kenv" },
  { name: "kenv-rm", placeholder: "Remove a kenv" },
  { name: "sync-path", placeholder: "Update PATH" },
  { name: "clear", placeholder: "Clear the caches" },
]

let cliScripts: CLIMenuItem[] = [
  ...(hasScripts ? requiresScripts : []),
  {
    name: "new",
    placeholder: `Create a script using ${
      process.env.KIT_MODE === "ts"
        ? "TypeScript"
        : "JavaScript"
    }`,
  },
  {
    name: "open",
    placeholder: "Open .kenv directory in editor",
  },
  { name: "browse", placeholder: "Go to scriptkit.com" },
  {
    name: "new-from-template",
    placeholder: "Create a new script from a template",
  },
  {
    name: "new-from-url",
    placeholder: "Create a script from a url",
  },
  {
    name: "share-script",
    placeholder: "Share a script as a Gist",
  },
  {
    name: "share-script-as-link",
    placeholder: "Share a script as a scriptkit.com link",
  },
  {
    name: "duplicate",
    alias: "cp",
    placeholder: "Duplicate a script",
  },
  {
    name: "rename",
    alias: "mv",
    placeholder: "Rename a script",
  },
  {
    name: "remove",
    alias: "rm",
    placeholder: "Remove a script",
  },

  // {
  //   name: "update",
  //   placeholder: `Version: ${process.env.KIT_APP_VERSION}`,
  // },
  {
    name: "install",
    alias: "i",
    placeholder: "Install an npm package",
  },
  {
    name: "uninstall",
    alias: "un",
    placeholder: "Uninstall an npm package",
  },
  {
    name: "set-env-var",
    placeholder: "Add env var to .env",
  },
  { name: "open-log", placeholder: "Open kit.log" },

  ...(jsh ? [] : notJsh),

  kitMode() === "ts"
    ? {
        name: "switch-to-js",
        placeholder: "Switch to JavaScript Mode",
      }
    : {
        name: "switch-to-ts",
        placeholder: "Switch to TypeScript Mode",
      },
  { name: "quit", placeholder: "Quit Kit" },
]

export let runCli = async () => {
  if (global?.flag?.start) {
    console.log(
      chalk`>_ Welcome to {green.bold Script Kit}!
`
    )
  }

  let script = await arg(`What do you want to do?`, () =>
    cliScripts.map(({ name, placeholder, alias }) => {
      return {
        name: chalk`{green.bold ${name}}${
          alias ? chalk` {yellow (${alias})}` : ""
        }: ${placeholder}`,
        value: name,
      }
    })
  )

  let found = cliScripts.find(
    config =>
      config.name == script || config.alias == script
  )

  if (found) {
    await cli(found.name as keyof CLI)
  } else {
    let scriptPath = resolveToScriptPath(script)

    await run(scriptPath)
  }
}

export {}
