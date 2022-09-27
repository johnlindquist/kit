/**
@param keyString - Accepts string of shortcut
@example
```
await keystroke("command option e")
```
*/

import { Channel } from "../core/enum.js"

global.keystroke = async (keyString: string) => {
  await hide()
  let keyCodes = {
    left: "123",
    right: "124",
    down: "125",
    up: "126",
  }

  let keys = keyString.split(" ")

  let key = keys.pop().toLowerCase()
  let modifiers = keys
    .map(modifier => `${modifier} down,`)
    .join(" ")
    .slice(0, -1)

  let strokeOrCode = keyCodes[key]
    ? `key code ${keyCodes[key]}`
    : `keystroke "${key}"`

  return await applescript(
    String.raw`
    tell application "System Events"
       ${strokeOrCode} ${
      modifiers.length ? `using {${modifiers}}` : ``
    }
    end tell
    `
  )
}

global.pressKeyboardShortcut = async (
  application = "",
  key = "",
  commands = []
) => {
  // We want them as an array for formatCommands so we split on ","
  const formattedCommands = formatCommands(commands)
  // Note: we have to activate an application first in order to use this script with it
  // Otherwise, it will run the keyboard shortcut on Script Kit
  return await applescript(
    String.raw`
    activate application "${application}"
    tell application "System Events"
      keystroke "${key}" using {${formattedCommands}}
    end tell
    `
  )
}

function formatCommands(commands = []) {
  // This will turn ["control", "command"]
  // into this "control down, command down,"
  // and then slice the last commma
  return commands
    .map(command => `${command} down,`)
    .join(" ")
    .slice(0, -1)
}
