front = env.front || ""

setFrontMost = async () => {
  if (!front)
    front = await applescript(`
path to frontmost application as Unicode text
`)
}

applescript = async (script, options) => {
  let formattedScript = script.replace(/'/g, "'\"'\"'")
  return exec(`osascript -e '${formattedScript}'`, options)
    .toString()
    .trim()
}

notify = async (title, subtitle) => {
  applescript(
    `display notification with title "${title}" subtitle "${subtitle}"`
  )
}

preview = async file => {
  exec(`qlmanage -p "${file}"`, { silent: true })
}

say = async string =>
  applescript(`say "${string}" speaking rate 250`)

getSelectedText = async () => {
  if (front) {
    await applescript(
      `tell application "${front}" to activate`
    )
  }
  await applescript(
    `tell application "System Events" to keystroke "c" using command down`
  )
  return await applescript(`get the clipboard`)
}

setSelectedText = async text => {
  await applescript(`set the clipboard to "${text}"`)

  if (!front) setFrontMost()
  if (front) {
    await applescript(
      `tell application "${front}" to activate`
    )
  }
  await applescript(
    `tell application "System Events" to keystroke "v" using command down`
  )
}

iterm = command => {
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

show = async (html, options) => {
  let showHtml = path.join(env.SIMPLE_TMP_PATH, "show.html")
  await writeFile(showHtml, html)

  let url = "file://" + showHtml
  if (process.send) {
    process.send({
      ...options,
      from: "show",
      frame: false,
      titleBarStyle: "customButtonsOnHover",
      url,
    })
  } else {
    exec(`open ${url}`)
  }
}

getSelectedPath = async () => {
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
