frontAppName = null
selectedText = null

applescript = async (
  script,
  options = { silent: true }
) => {
  let formattedScript = script.replace(/'/g, "'\"'\"'")
  return exec(`osascript -e '${formattedScript}'`, options)
    .toString()
    .trim()
}

getSelectedText = async () => {
  process.send({ from: "hide" })
  await applescript(
    `tell application "System Events" to keystroke "c" using command down`
  )

  return await applescript(`get the clipboard`)
}
;(beforePrompt = async () => {
  if (frontAppName) return
  let result = await applescript(
    `
global frontApp, frontAppName

tell application "System Events"
	set frontApp to first application process whose frontmost is true
	set frontAppName to name of frontApp
end tell

return {frontAppName}
`
  )

  let results = result.split(",")
  frontAppName ||= results[0]
})()

notify = async (title, subtitle) => {
  applescript(
    `display notification with title "${title}" subtitle "${subtitle}"`
  )
}

preview = async file => {
  exec(`qlmanage -p "${file}"`, { silent: true })
}

//List voices: `say -v "?"`. Get more voices: Preferences->Accessibility->System Voices
say = async (string, { rate = 250, voice = "Alex" } = {}) =>
  await applescript(
    `say "${string}" using "${voice}" speaking rate ${rate}`
  )

setSelectedText = async text => {
  await applescript(`set the clipboard to "${text}"`)
  if (process?.send) process.send({ from: "hide" })
  await applescript(
    `tell application "System Events" to keystroke "v" using command down`
  )
}

getSelectedFile = async () => {
  return await applescript(
    `-------------------------------------------------
    # Full path of selected items in Finder.
    -------------------------------------------------
    tell application "Finder"
      set finderSelList to selection as alias list
    end tell
    
    if finderSelList ≠ {} then
      repeat with i in finderSelList
        set contents of i to POSIX path of (contents of i)
      end repeat
      
      set AppleScript's text item delimiters to linefeed
      finderSelList as text
    end if
    -------------------------------------------------`,
    { silent: true }
  )
}

getPathAsPicture = async path =>
  await applescript(
    `set the clipboard to (read (POSIX file ${path} as JPEG picture)`
  )

getActiveScreen = async () =>
  new Promise((res, rej) => {
    let messageHandler = data => {
      if (data.from === "system") {
        res(data.activeScreen)
        process.off("message", messageHandler)
      }
    }
    process.on("message", messageHandler)

    process.send({ from: "system" })
  })

setActiveAppBounds = async ({
  left,
  top,
  right,
  bottom,
}) => {
  await applescript(
    `tell application "System Events"
      set processName to name of first application process whose frontmost is true as text
      tell process processName to set the position of front window to {${left}, ${top}}
      tell process processName to set the size of front window to {${
        right - left
      }, ${bottom - top}}
    end tell`
  )
}

terminal = async script => {
  return await applescript(`tell application "Terminal"
do script "${script}"
activate
end tell
`)
}

iterm = async command => {
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
  applescript(script)
}

let possibleTerminals = ["terminal", "iterm"]

let terminalEditor = editor => async file =>
  await global[
    await env("SIMPLE_TERMINAL", {
      message: `Which Terminal do you use with ${editor}?`,
      choices: possibleTerminals,
    })
  ](`${editor} ${file}`)

vim = terminalEditor("vim")
nano = terminalEditor("nano")

const possibleEditors = [
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

code = async (file, dir, line = 0, col = 0) => {
  let codeArgs = ["--goto", `${file}:${line}:${col}`]
  if (dir) codeArgs = [...codeArgs, "--folder-uri", dir]
  codeArgs = codeArgs.join(" ")
  let command = `code ${codeArgs}`
  exec(command)
}

edit = async (file, dir, line = 0, col = 0) => {
  if (arg?.edit == false) return

  let editor = await env("SIMPLE_EDITOR", {
    message:
      "Which code editor do you use? (You can always change this later in .env)",
    choices: [
      ...possibleEditors
        .filter(editor => global[editor])
        .filter(editor => which(editor))
        .map(editor =>
          which(editor).toString().trim().split("/").pop()
        ),
      {
        name: "None. Always copy path to clipboard",
        value: "copy",
      },
    ],
  })

  await global[editor](file)

  echo(
    chalk`> Opening {yellow ${file}} with {green.bold ${env.SIMPLE_EDITOR}}`
  )
}

// TODO: Optimize, etc
fileSearch = async (name, { onlyin = "~", kind } = {}) => {
  let command = `mdfind${name ? ` -name ${name}` : ""}${
    onlyin ? ` -onlyin ${onlyin}` : ``
  }${kind ? ` "kind:${kind}"` : ``}`
  console.log(command)

  return exec(command, {
    silent: true,
  })
    .toString()
    .split("\n")
}
