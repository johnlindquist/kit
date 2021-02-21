applescript = async (
  script,
  options = { silent: true }
) => {
  let formattedScript = script.replace(/'/g, "'\"'\"'")
  await writeFile(
    simplePath("tmp", "_testing.applescript"),
    script
  )

  let { stdout, stderr } = exec(
    `osascript -e '${formattedScript}'`,
    options
  )

  if (stderr) {
    console.log(stderr)
    exit()
  }

  return stdout
}

getSelectedText = async () => {
  await applescript(
    `tell application "System Events" to keystroke "c" using command down`
  )

  return await applescript(`get the clipboard`)
}

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
  await applescript(
    `set the clipboard to "${text.replaceAll('"', '\\"')}"`
  )
  if (process?.send) process.send({ from: "HIDE_APP" })
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

edit = async (file, dir, line = 0, col = 0) => {
  if (arg?.edit == false) return

  let { possibleEditors, ...macEditors } = await simple(
    "apps/mac/editor"
  )

  let editor = await env("SIMPLE_EDITOR", {
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

  let execEditor = file =>
    exec(`${editor} ${file}`, { env: {} })
  let editorFn = macEditors[editor] || execEditor

  let result = await editorFn(file)

  if (result?.stderr) {
    console.warn(`STDERR ${stderr}`)
    exit()
  }

  console.log(
    chalk`> Opening {yellow ${file}} with {green.bold ${env.SIMPLE_EDITOR}}`
  )
}

// TODO: Optimize, etc
fileSearch = async (name, { onlyin = "~", kind } = {}) => {
  let command = `mdfind${name ? ` -name ${name}` : ""}${
    onlyin ? ` -onlyin ${onlyin}` : ``
  }${kind ? ` "kind:${kind}"` : ``}`

  return exec(command, {
    silent: true,
  })
    .toString()
    .split("\n")
}
