applescript = async (script, options) => {
  let formattedScript = script.replace(/'/g, "'\"'\"'")
  return exec(`osascript -e '${formattedScript}'`, options)
    .toString()
    .trim()
}

notify = async (title, subtitle) => {
  let os = await import("os")
  if (os.platform() == "darwin") {
    applescript(
      `display notification with title "${title}" subtitle "${subtitle}"`
    )
  } else {
    console.log(
      `notify is currently supported on your system`
    )
  }
}

preview = async file => {
  let os = await import("os")
  if (os.platform() == "darwin") {
    exec(`qlmanage -p "${file}"`, { silent: true })
  } else {
    exec(`open ` + file)
  }
}

say = async string => {
  let os = await import("os")
  if (os.platform() == "darwin") {
    return applescript(`say "${string}" speaking rate 250`)
  } else {
    console.log(
      `"say" is currently unsupported on your platform`
    )
  }
}

getSelectedText = async () => {
  let { default: robotjs } = await need("robotjs")
  let { default: clipboardy } = await need("clipboardy")
  robotjs.keyTap("c", "command")
  return clipboardy.readSync()
}

setSelectedText = async text => {
  let { default: robotjs } = await need("robotjs")
  let { default: clipboardy } = await need("clipboardy")
  clipboardy.writeSync(text)
  robotjs.keyTap("v", "command")
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
