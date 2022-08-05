// TODO: Optimize, etc
global.fileSearch = async (
  name,
  { onlyin = "~", kind = "" } = {}
) => {
  let command = `/usr/bin/mdfind${
    name ? ` -name ${name}` : ""
  }${onlyin ? ` -onlyin ${onlyin}` : ``}${
    kind ? ` "kind:${kind}"` : ``
  }`

  let results = await global.exec(command)

  return results.stdout.split("\n").filter(Boolean)
}

global.getSelectedFile = async () => {
  return await applescript(
    String.raw`
      tell application "Finder"
        set finderSelList to selection as alias list
      end tell
      
      if finderSelList ≠ {} then
        repeat with i in finderSelList
          set contents of i to POSIX path of (contents of i)
        end repeat
        
        set AppleScript's text item delimiters to linefeed
        finderSelList as text
      end if`
  )
}

global.getSelectedDir = async () => {
  return await applescript(`
 tell application "Finder"
     if exists Finder window 1 then
         set currentDir to target of Finder window 1 as alias
     else
         set currentDir to desktop as alias
     end if
 end tell
 POSIX path of currentDir
 `)
}

global.setSelectedFile = async (filePath: string) => {
  await applescript(`
set aFile to (POSIX file "${filePath}") as alias
tell application "Finder" to select aFile
`)
}

global.copyPathAsImage = async path =>
  await applescript(
    String.raw`set the clipboard to (read (POSIX file "${path}") as JPEG picture)`
  )

global.copyPathAsPicture = copyPathAsImage

global.selectFolder = async (
  message: string = "Pick a folder:"
) => {
  return await applescript(
    `set f to choose folder with prompt "${message}"
    set p to POSIX path of f
    `
  )
}

global.selectFile = async (
  message: string = "Pick a file:"
) => {
  return await applescript(
    `set f to choose file with prompt "${message}"
    set p to POSIX path of f
    `
  )
}

global.revealInFinder = async filePath => {
  await open(path.dirname(filePath))
  await applescript(`
set aFile to (POSIX file "${filePath}") as alias
tell application "Finder" to select aFile
`)
}

export {}
