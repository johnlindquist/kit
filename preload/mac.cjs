applescript = async (
  script,
  options = { silent: true }
) => {
  let formattedScript = script.replace(/'/g, "'\"'\"'")
  if (env?.DEBUG) {
    await writeFile(
      projectPath("tmp", "_debug.applescript"),
      script
    )
  }

  let { stdout, stderr } = exec(
    `osascript -e '${formattedScript}'`,
    options
  )

  if (stderr) {
    console.log(stderr)
    exit()
  }

  return stdout.trim()
}

let terminal = async script => {
  let command = `tell application "Terminal"
  do script "${script}"
  activate
  end tell
  `

  return await applescript(command)
}

let iterm = async command => {
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
  return await applescript(script)
}

let terminalEditor = editor => async file => {
  //TODO: Hyper? Other terminals?
  let termMap = { terminal, iterm }

  let possibleTerminals = () =>
    Object.entries(termMap)
      .filter(async ([name, value]) => {
        return fileSearch(name, {
          onlyin: "/",
          kind: "application",
        })
      })
      .map(([name, value]) => ({ name, value: name }))

  let terminal = await env("KIT_TERMINAL", {
    message: `Which Terminal do you use with ${editor}?`,
    choices: possibleTerminals(),
  })

  let macTerminals = [terminal, iterm]

  return macTerminals[terminal](`${editor} ${file}`)
}

edit = async (file, dir, line = 0, col = 0) => {
  if (arg?.edit == false) return

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
    ].filter(
      editor =>
        exec(
          `PATH="/usr/bin:/usr/local/bin" which ${editor}`,
          { silent: true }
        ).stdout
    )

  let editor = await env("KIT_EDITOR", {
    message:
      "Which code editor do you use? (You can always change this later in .env)",
    choices: [
      ...possibleEditors(),
      {
        name: "None. Always copy path to clipboard",
        value: "copy",
      },
    ],
  })

  let code = async (file, dir, line = 0, col = 0) => {
    let codeArgs = ["--goto", `${file}:${line}:${col}`]
    if (dir) codeArgs = [...codeArgs, "--folder-uri", dir]
    codeArgs = codeArgs.join(" ")
    let command = `code ${codeArgs}`
    exec(command)
  }

  let vim = terminalEditor("vim")
  let nano = terminalEditor("nano")
  let macEditors = [code, vim, nano]

  let execEditor = file =>
    exec(`${editor} ${file}`, { env: {} })
  let editorFn = macEditors[editor] || execEditor
  send("UPDATE_PROMPT_INFO", {
    info: `Opening ${file} with ${env.KIT_EDITOR}`,
  })

  let result = await editorFn(file)

  if (result?.stderr) {
    console.warn(`STDERR ${stderr}`)
    exit()
  }

  console.log(
    chalk`> Opening {yellow ${file}} with {green.bold ${env.KIT_EDITOR}}`
  )
}
