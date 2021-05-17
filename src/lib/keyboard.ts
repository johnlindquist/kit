/**
@param keyString - Accepts string of shortcut
@example
```
await keystroke("command option e")
```
*/

export let keystroke = async (keyString: string) => {
  send("HIDE_APP")
  let keys = keyString.split(" ")
  if (keys.length < 2)
    throw new Error(`${keyString} isn't formatted properly`)

  let key = keys.pop()
  let modifiers = keys
    .map(modifier => `${modifier} down,`)
    .join(" ")
    .slice(0, -1)

  return await applescript(
    String.raw`
    tell application "System Events"
      keystroke "${key}" using {${modifiers}}
    end tell
    `
  )
}

export async function pressKeyboardShortcut(
  application = "",
  key = "",
  commands = []
) {
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
