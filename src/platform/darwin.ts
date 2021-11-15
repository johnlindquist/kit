import { kitMode, KIT_DEFAULT_PATH } from "../core/utils.js"

global.applescript = async (
  script,
  options = { silent: true }
) => {
  let formattedScript = script.replace(/'/g, "'\"'\"'")
  if (global.env?.DEBUG) {
    await writeFile(
      kenvPath("tmp", "_debug.applescript"),
      script
    )
  }

  let p = new Promise<string>((res, rej) => {
    let stdout = ``
    let stderr = ``
    let child = spawn(
      `osascript`,
      [`-e`, `${formattedScript}`],
      options
    )

    child.stdout.on("data", data => {
      stdout += data.toString()
    })
    child.stderr.on("data", data => {
      stderr += data.toString()
    })

    child.on("exit", () => {
      res(stdout)
    })

    child.on("error", () => {
      rej(stderr)
    })
  })

  return p
}

global.terminal = async script => {
  let formattedScript = script.replace(/'|"/g, '\\"')

  let command = `tell application "Terminal"
  do script "${formattedScript}"
  activate
  end tell
  `

  return await global.applescript(command)
}

global.iterm = async command => {
  command = `"${command.replace(/"/g, '\\"')}"`
  let script = `
    tell application "iTerm"
        if application "iTerm" is running then
            try
                tell the first window to create tab with default profile
            on error
                create window with default profile
            end try
        end if
    
        delay 0.1
    
        tell the first window to tell current session to write text ${command}
        activate
    end tell
    `.trim()
  return await global.applescript(script)
}

let terminalEditor = editor => async file => {
  //TODO: Hyper? Other terminals?
  let supportedTerminalMap = {
    terminal: global.terminal,
    iterm: global.iterm,
  }

  let possibleTerminals = () =>
    Object.entries(supportedTerminalMap)
      .filter(async ([name, value]) => {
        return fileSearch(name, {
          onlyin: "/",
          kind: "application",
        })
      })
      .map(([name, value]) => ({ name, value: name }))

  let KIT_TERMINAL = await global.env("KIT_TERMINAL", {
    placeholder: `Which Terminal do you use with ${editor}?`,
    choices: possibleTerminals(),
  })

  return supportedTerminalMap[KIT_TERMINAL](
    `${editor} ${file}`
  )
}

let execConfig = () => {
  return {
    env: {
      HOME: home(),
      PATH: KIT_DEFAULT_PATH,
    },
  }
}

global.selectKitEditor = async (reset = false) => {
  let possibleEditors = () =>
    [
      "atom",
      "code",
      "emacs",
      "nano",
      "ne",
      "nvim",
      "sublime",
      "webstorm",
      "vim",
    ]
      .filter(
        editor =>
          exec(`which ${editor}`, {
            silent: true,
            env: {
              PATH: KIT_DEFAULT_PATH,
            },
          }).stdout
      )
      .map(name => ({ name, value: name }))

  return await global.env("KIT_EDITOR", {
    reset,
    placeholder: "Which code editor do you use?",
    hint: `You can always change this later in .env`,
    preview: md(`
    
## Don't see your editor?

Set up your editor's command-line tools:

- [Visual Studio Code](https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line)
- [WebStorm](https://www.jetbrains.com/help/webstorm/working-with-the-ide-features-from-command-line.html)
- [Sublime](https://www.sublimetext.com/docs/command_line.html)
- [Atom](https://flight-manual.atom.io/getting-started/sections/installing-atom/#installing-atom-on-mac)

## Customized your editor command?

If you edited your ~/.zshrc (or similar) for a custom command then sync your PATH to Script Kit's .env:

Run the following in your terminal:
~~~bash
~/.kit/bin/kit sync-path
~~~

## Still not working?

Kit.app reads the \`KIT_EDITOR\` value from your \`~/.kenv/.env\`. It can either be a command on the PATH
or an absolute path to your editor. This prompt is attempting to set that value for you, but you can also do it manually.

If you need additional help, we're happy to answer questions:

- [GitHub Discussions](https://github.com/johnlindquist/kit/discussions/categories/q-a)
    `),
    choices: () => [
      ...possibleEditors(),
      {
        name: "None. Always copy path to clipboard",
        value: "copy",
      },
    ],
  })
}

let atom = async (file: string, dir: string) => {
  let command = `atom "${file}"${dir ? ` "${dir}"` : ``}`
  exec(command, execConfig())
}

let code = async (file, dir, line = 0, col = 0) => {
  let codeArgs = ["--goto", `${file}:${line}:${col}`]
  if (dir) codeArgs = [...codeArgs, "--folder-uri", dir]
  let command = `code ${codeArgs.join(" ")}`

  let config = execConfig()
  exec(command, config)
}

let vim = terminalEditor("vim")
let nvim = terminalEditor("nvim")
let nano = terminalEditor("nano")
let fullySupportedEditors = {
  code,
  vim,
  nvim,
  nano,
  atom,
}

global.edit = async (file, dir, line = 0, col = 0) => {
  if (global.flag?.edit === false) return

  let KIT_EDITOR = await global.selectKitEditor(false)

  let execEditor = (file: string) => {
    let editCommand = `${KIT_EDITOR} ${file}`

    exec(editCommand, execConfig())
  }
  let editorFn =
    fullySupportedEditors[KIT_EDITOR] || execEditor
  console.log(
    `Opening ${file} with ${global.env.KIT_EDITOR}`
  )

  let result = await editorFn(file, dir, line, col)

  if (result?.stderr) {
    console.warn(`STDERR ${result.stderr}`)
    exit()
  }
}

global.openLog = () => {
  let logPath = global.kitScript
    .replace("scripts", "logs")
    .replace(new RegExp(`\${kitMode()}$`), "log")

  console.log(`📂 Open log ${logPath}`)

  global.edit(logPath)
}
