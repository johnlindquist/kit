//Description: Select some text then run this command from a keyboard shortcut
let { applescript } = await import("./osx/applescript.js")

let clipboard = await applescript(`
tell application "System Events" to keystroke "c" using {command down}
the clipboard
`)

if (arg?.titleCase) {
  let { titleCase } = await need("title-case")

  let titleCased = titleCase(clipboard.toString().trim())

  await applescript(`
    set the clipboard to "${titleCased}"
    tell application "System Events" to keystroke "v" using {command down}
    `)
}
