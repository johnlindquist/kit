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

  let command = `osascript -e '${formattedScript}'`
  let { stdout, stderr } = exec(command, options)

  if (stderr) {
    console.log(stderr)
    throw new Error(stderr)
  }

  return stdout.trim()
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

  let { fileSearch } = await global.kit("file")
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
  let editorParentPath = "/usr/local/bin"
  let PATH = [
    editorParentPath,
    ...process.env.PATH.split(":"),
  ]
    .filter(p => !p.startsWith(home()))
    .join(":")
  return {
    env: {
      HOME: home(),
      PATH,
    },
  }
}

global.selectKitEditor = async reset => {
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
          exec(
            `PATH="/usr/bin:/usr/local/bin" which ${editor}`,
            { silent: true }
          ).stdout
      )
      .map(name => ({ name, value: name }))

  return await global.env("KIT_EDITOR", {
    reset,
    placeholder:
      "Which code editor do you use? (You can always change this later in .env)",
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
  if (!global.flag?.edit) return

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
    .replace(".js", ".log")

  console.log(`📂 Open log ${logPath}`)

  global.edit(logPath)
}
