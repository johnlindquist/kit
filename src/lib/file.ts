// TODO: Optimize, etc
global.fileSearch = async (
  name,
  { onlyin = "~", kind = "" } = {}
) => {
  let command = `mdfind${name ? ` -name ${name}` : ""}${
    onlyin ? ` -onlyin ${onlyin}` : ``
  }${kind ? ` "kind:${kind}"` : ``}`

  return global
    .exec(command, {
      silent: true,
    })
    .toString()
    .split("\n")
}

global.getSelectedFile = async () => {
  return await applescript(
    String.raw`-------------------------------------------------
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

global.copyPathAsImage = async path =>
  await applescript(
    String.raw`set the clipboard to (read (POSIX file "${path}") as JPEG picture)`
  )

global.copyPathAsPicture = copyPathAsImage

global.selectFolder = async (message:string = "Pick a folder:") => {
  return await applescript(
    `set f to choose folder with prompt "${message}"
    set p to POSIX path of f
    `
  )
}

global.selectFile = async (message:string = "Pick a file:") => {
  return await applescript(
    `set f to choose file with prompt "${message}"
    set p to POSIX path of f
    `
  )
}

export {}
