// TODO: Optimize, etc
export let fileSearch = async (name, { onlyin = "~", kind = "" } = {}) => {
    let command = `mdfind${name ? ` -name ${name}` : ""}${onlyin ? ` -onlyin ${onlyin}` : ``}${kind ? ` "kind:${kind}"` : ``}`;
    return exec(command, {
        silent: true,
    })
        .toString()
        .split("\n");
};
export let getSelectedFile = async () => {
    return await applescript(String.raw `-------------------------------------------------
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
      -------------------------------------------------`, { silent: true });
};
export let copyPathAsPicture = async (path) => await applescript(String.raw `set the clipboard to (read (POSIX file "${path}") as JPEG picture)`);
