front = env.front || ""

getFrontMost = async () => {
  if (!front)
    front = await applescript(`
path to frontmost application as Unicode text
`)
  return front
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

  let front = await getFrontMost()
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

//tell application "System Events" to tell process "Code" to set the size of front window to {300, 300}
