let { applescript } = await import("./applescript.js")

export let getSelectedPath = async () => {
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
